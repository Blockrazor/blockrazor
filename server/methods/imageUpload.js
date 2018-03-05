import { Meteor } from 'meteor/meteor';
import { WalletImages } from '../../lib/database/Images.js';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';
import { RatingsTemplates } from '../../lib/database/Ratings.js'
import { log } from '../main'
import { UserData } from '../../lib/database/UserData.js'
import { Bounties, REWARDCOEFFICIENT } from '../../lib/database/Bounties'
import { creditUserWith, removeUserCredit } from '../../server/serverdb/rewards'

Meteor.methods({
    getWalletReward: (userId, rId) => {
        let bounty = Bounties.findOne({
            userId: userId,
            type: 'new-wallet'
        })

        let lastWalletAnswer = Ratings.find({
            $or: [{
                catagory: 'wallet'
            }, {
                context: 'wallet'
            }]
        }, {
            sort: {
                answeredAt: -1
            }
        }).fetch()[0]

        let r = Ratings.findOne({
            _id: rId
        }) || {}

        let count = Ratings.find({
            $or: [{
                answered: false,
                catagory: 'wallet'
            }, {
                answered: false,
                context: 'wallet'
            }]
        }).count()

        if (bounty) {
            if (!count) {
                Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {}) // delete the bounty, we're done with it
            }

            if (bounty.expiresAt < r.answeredAt) {
                console.log('already expired')
                return ((Date.now() - lastWalletAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3
            } else {
                console.log('actual bounty')
                return Number(bounty.currentReward)
            }
        } else {
            console.log('no bounty')
            return ((Date.now() - lastWalletAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3
        }
    },
  'flagWalletImage': function(imageId) {
    if(!this.userId){throw new Meteor.Error('error', 'please log in')};
    WalletImages.update(imageId, {
      $addToSet: {flaglikers: Meteor.userId()},
      $inc: {flags: 1}
    });
  },
  'approveWalletImage': function(imageId) {
    if(!this.userId){throw new Meteor.Error('error', 'please log in')};
    if(WalletImages.findOne({_id: imageId}).createdBy == this.userId) {
      throw new Meteor.Error('error', "You can't approve your own item.")
    };
    WalletImages.update(imageId, {
      $set: {approved: true, approvedBy: this.userId},
      $inc: {likes: 1}
    });
  },
  deleteWalletRatings: () => {
        let rem = Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                catagory: 'wallet'
            }, {
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                context: 'wallet'
            }]
        }).fetch()

        let reward = rem.reduce((i1, i2) => i1 + (i2.reward || 0), 0)

        Ratings.update({ 
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                catagory: 'wallet'
            }, {
                owner: Meteor.userId(),
                processed: false,
                context: 'wallet'
            }]
        }, {
            $set: {
                answered: false,
                answeredAt: null,
                winner: null,
                loser: null,
                reward: 0
            }
        }, {
            multi: true
        }) // reset only ratings from this session, don't reset already processed ratings, as this would mess up previous ELO calculations

        removeUserCredit(reward, Meteor.userId(), 'cheating on wallet questions')
    },
   getLastWalletAnswer: () => {
        return Ratings.find({
            $or: [{
                catagory: 'wallet'
            }, {
                context: 'wallet'
            }]
        }, {
            sort: {
                answeredAt: -1
            }
        }).fetch()[0]
    },
  'answerRating': function(ratingId, winner) {
    let rating = Ratings.findOne({_id:ratingId})
    if (rating.owner == this.userId) {
      var loser = rating.currency0Id;
      if(loser == winner) {
        loser = rating.currency1Id;
      }
      if(winner == "tie") {
        loser = "tie";
      }

      let question = RatingsTemplates.findOne({
        _id: rating.questionId
      })

      if (question.xors) {
        question.xors.forEach(i => {
          let q = RatingsTemplates.findOne({
            _id: i
          })

          let r = Ratings.findOne({
            questionId: i,
            currency0Id: rating.currency0Id,
            currency1Id: rating.currency1Id
          }) || {} // get the rating on same currency pair

          let bo = true
          if ((!q.negative && question.negative) || (q.negative && !question.negative)) { // XOR
            bo = false
          }

          if (r.answered) {
            if (winner !== 'tie' && r.winner !== 'tie' && ((bo && (winner !== r.loser || loser !== r.winner)) || (!bo && (winner !== r.winner || loser !== r.loser)))) {
              throw new Meteor.Error('Error.', 'xor')
            }
          }
        })
      }

      Ratings.upsert({_id:ratingId}, {
        $set: {
          answered: true,
          winner: winner,
          loser: loser,
          answeredAt: new Date().getTime()
        }})

        Meteor.call('getWalletReward', Meteor.userId(), ratingId, (err, data) => {
            console.log(data)

            Ratings.update({
                _id: ratingId
            }, {
                $set: {
                    reward: data // save the reward so we can remove it later on if needed
                }
            })

            creditUserWith(data, Meteor.userId(), 'answering a wallet question')
        })
    }
  },
    addRatingQuestion: (question, catagory, negative, context, xors) => {
        if (!Meteor.userId()){
            throw new Meteor.Error('Error.', 'You need to be logged.')
        }

        let id = parseInt(`0x${CryptoJS.MD5(question).toString().slice(0,10)}`, 16).toString()

        let n = RatingsTemplates.insert({
            _id: id,
            question: question,
            catagory: catagory,
            createdBy: Meteor.userId(),
            createdAt: new Date().getTime(),
            negative: !!negative,
            context: context,
            xors: xors
        })

        // XOR is symmetrical
        xors.forEach(i => {
            RatingsTemplates.update({
                _id: i
            }, {
                $push: {
                    xors: n
                }
            })
        })
  },
  deleteQuestion: (questionId) => {
    let question = RatingsTemplates.findOne({
      _id: questionId
    })
    // you can only delete a question if you're a moderator
    var moderatorValue = UserData.findOne({ _id: Meteor.userId() }, { fields: { moderator: true } }).moderator;
    if (moderatorValue === 1) {
      RatingsTemplates.remove({
        _id: questionId
      })
    }
  },
  toggleContextQuestion: (questionId) => {
    let question = RatingsTemplates.findOne({
      _id: questionId
    })

    // you can only change context of a question if you're a moderator
    var moderatorValue = UserData.findOne({ _id: Meteor.userId() }, { fields: { moderator: true } }).moderator;
    if (moderatorValue === 1) {
      RatingsTemplates.update({
        _id: questionId
      }, {
        $set: {
          negative: !question.negative
        }
      })
    }
  },
  //this will populate the ratings database for this user with any new Currencies
  //they have added, or if an admin has added new questions for their existing currencies.
  'populateRatings': function() {
    //fetch all the currencies this user uses:
    var images = WalletImages.find({createdBy: this.userId,allImagesUploaded:true}).fetch();

    var currencies = [];
    for (i in images) {
      currencies.push(images[i].currencyId);
    }
    var currencies = _.uniq(currencies);

    //fetch the questions that will be asked of the user
    var ratingTemplates = RatingsTemplates.find({
        $or: [{
            catagory: 'wallet'
        },
        {
            context: 'wallet'
        }]
    }).fetch();
    var userInt = parseInt("0x" + CryptoJS.MD5(this.userId).toString().slice(0,10), 16);

//Cycle through all possible combinations of currencies that this user has a wallet for
    for (i = 0; i < currencies.length - 1; i++) {
      for (j = i + 1; j < currencies.length; j++) {
        //we don't want to generate duplicate currency pairs for the user, the fastest way to make sure
        //is to combine the currency pairs and user ID into a number so that no matter what way
        //you combine this the result will be the same, new additions can then be compared immediately
       //and be verified unique for this user.
        var dec_i = parseInt("0x" + CryptoJS.MD5(currencies[i]).toString().slice(0,10), 16);
        var dec_j = parseInt("0x" + CryptoJS.MD5(currencies[j]).toString().slice(0,10), 16);
        //add truncated MD5 of currencyId's and userId to prevent duplicates
        var _id = dec_i + dec_j + userInt;
        //add question truncated MD5 Int to the _id
        for (k in ratingTemplates) {
          console.log(currencies[i] + " " + currencies[j] + " " + ratingTemplates[k]._id)
          id = (_id + parseInt(ratingTemplates[k]._id, 10)).toString();
          console.log(id);
          try{
            Ratings.insert({
              _id: id,
              'owner': this.userId,
              'currency0Id': currencies[i],
              'currency1Id': currencies[j],
              'winner': null,
              'loser': null,
              'currency0approved': false,
              'currency1approved': false,
              'questionId': ratingTemplates[k]._id,
              'questionText': ratingTemplates[k].question,
              'createdAt': new Date().getTime(),
              'processedAt': null,
              'processed': false,
              'catagory': ratingTemplates[k].catagory,
              'context': ratingTemplates[k].context,
              'type': "wallet",
              'answeredAt': null,
              'answered': false
            })
          } catch(error) {
            log.error(`the combination of ${currencies[i]} and ${currencies[j]} exists in populateRatings!`, error)
          }
        }
      }
    }
  },
  portWalletImages: () => {
    WalletImages.find({}).fetch().forEach(i => {
        if (!i.currencySlug) {
            WalletImages.update({
                _id: i._id
            }, {
                $set: {
                    currencySlug: (Currencies.findOne({ _id: i.currencyId }) || {}).slug
                }
            })
        }
    })
  },
    'uploadWalletImage': function (fileName, imageOf, currencyId, binaryData, md5) {
      var error = function(error) {throw new Meteor.Error('error', error);}
      var md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString();
      if(md5validate != md5) {
        throw new Meteor.Error('connection error', 'failed to validate md5 hash');
        return false;
      }
        if (!this.userId) {
          console.log("NOT LOGGED IN");
          throw new Meteor.Error('error', 'You must be logged in to do this.');
          return false;
        }
        var fs = Npm.require('fs');

        //get mimetpe of uploaded file
        var mime = Npm.require('mime-types');
        var mimetype = mime.lookup(fileName);
        var validFile = _supportedFileTypes.includes(mimetype);
        var fileExtension = mime.extension(mimetype);
        var filename = (_walletUpoadDirectory + md5 + '.' + fileExtension);
        var filenameWatermark = (_walletUpoadDirectory + md5 + '_watermark.' + fileExtension);


        var insert = false;

        if (!validFile) {
            throw new Meteor.Error('Error', 'File type not supported, png, gif and jpeg supported');
            return false;
        }

        let currency = Currencies.findOne({_id:currencyId}) || {}
        if(!currency.currencyName){
          throw new Meteor.Error('error', 'error 135');
        }
        try {
          insert = WalletImages.insert({
            _id: md5,
            'currencyId':currencyId,
            'currencySlug': currency.slug,
            'currencyName': currency.currencyName,
            'imageOf': imageOf,
            'createdAt': new Date().getTime(),
            'createdBy': this.userId,
            'flags': 0,
            'likes': 0,
            'extension': fileExtension,
            'flaglikers': [],
            'approved': false,
            'allImagesUploaded': false
          });
        } catch(error) {
          throw new Meteor.Error('Error', 'That image has already been used on Blockrazor. You must take your own original screenshot of the wallet.');
        }
        //check if three files have been uploaded
        let walletCheckCount = WalletImages.find({currencyId:currencyId,createdBy:this.userId}).count();
        if(walletCheckCount===3){
          WalletImages.update({currencyId:currencyId,createdBy:this.userId},{$set: {allImagesUploaded: true}},{multi: true});
        }

        if(insert != md5) {throw new Meteor.Error('Error', 'Something is wrong, please contact help.');}

        fs.writeFileSync(filename, binaryData, {encoding: 'binary'}, Meteor.bindEnvironment(function(error){
            if(error){
              log.error('Error in uploadWalletImage', error)
            };
        }))

//Add watermark to image
if (gm.isAvailable) {
    gm(filename)
        .command('composite')
        .gravity('SouthEast')
        .out('-geometry', '+1+1')
        .in(_watermarkLocation)
        .write(filenameWatermark, Meteor.bindEnvironment(function(err, stdout, stderr, command) {
            if (err) console.error(err)
                //Delete original if no errors
                fs.unlinkSync(filename);

                //Old file gone, let's rename to just the md5 no need for watermark tag
                fs.rename(filenameWatermark, filename, function(err) {
                    if (err) console.error('ERROR: ' + err);
                });
        }))



    }else{
      log.error('required gm dependicies are not available', {})
    }
  },
      'deleteWalletImage': function(imageOf, currencyId) {
        const fs = require('fs')

          var error = function(error) { throw new Meteor.Error('error', error); }

          if (!this.userId) {
              console.log("NOT LOGGED IN");
              throw new Meteor.Error('error', 'You must be logged in to do this.');
              return false;
          }

          //remove image from file serverp
          let imageID = WalletImages.findOne({ currencyId: currencyId, imageOf: imageOf, createdBy: this.userId});
          let filename = imageID._id +'.'+ imageID.extension;
          fs.unlinkSync(_walletUpoadDirectory + filename)

          //remove all walletImages per query below
          WalletImages.remove({ currencyId: currencyId, imageOf: imageOf, createdBy: this.userId});


      }
      });

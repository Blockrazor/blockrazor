import { Meteor } from 'meteor/meteor'
import { Currencies, Communities, Ratings, RatingsTemplates, Bounties, REWARDCOEFFICIENT } from '/imports/api/indexDB.js'
import { log } from '/server/main'
import { creditUserWith, removeUserCredit } from '/imports/api/utilities.js'

Meteor.methods({
    getCommunityReward: (userId, rId) => {
        let bounty = Bounties.findOne({
            userId: userId,
            type: 'new-community'
        })

        let lastCommunityAnswer = Ratings.find({
            $or: [{
                catagory: 'community'
            }, {
                context: 'community'
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
                catagory: 'community'
            }, {
                answered: false,
                context: 'community'
            }]
        }).count()

        if (bounty) {
            if (!count) {
                Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {}) // delete the bounty, we're done with it
            }

            if (bounty.expiresAt < r.answeredAt) {
                console.log('already expired')
                return ((Date.now() - lastCommunityAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3
            } else {
                console.log('actual bounty')
                return Number(bounty.currentReward)
            }
        } else {
            console.log('no bounty')
            return ((Date.now() - lastCommunityAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3
        }
    },
    populateCommunityRatings: function() {
        let communities = Communities.find({
            createdBy: this.userId
        }).fetch()

        let currencies = _.uniq(communities.map(i => i.currencyId))

        //fetch the questions that will be asked of the user
        let ratingTemplates = RatingsTemplates.find({
            $or: [{
                catagory: 'community'
            },
            {
                context: 'community'
            }]
        }).fetch()

        let userInt = parseInt(`0x${CryptoJS.MD5(this.userId).toString().slice(0,10)}`, 16)

        //Cycle through all possible combinations of currencies that this user has a wallet for
        for (i = 0; i < currencies.length - 1; i++) {
            for (j = i + 1; j < currencies.length; j++) {
                //we don't want to generate duplicate currency pairs for the user, the fastest way to make sure
                //is to combine the currency pairs and user ID into a number so that no matter what way
                //you combine this the result will be the same, new additions can then be compared immediately
               //and be verified unique for this user.
                let dec_i = parseInt(`0x${CryptoJS.MD5(currencies[i]).toString().slice(0,10)}`, 16)
                var dec_j = parseInt(`0x${CryptoJS.MD5(currencies[j]).toString().slice(0,10)}`, 16)
                //add truncated MD5 of currencyId's and userId to prevent duplicates
                let _id = dec_i + dec_j + userInt
                //add question truncated MD5 Int to the _id
                for (k in ratingTemplates) {
                    id = `${(_id + parseInt(ratingTemplates[k]._id, 10)).toString()}c`
                    try {
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
                            'type': 'community',
                            'answeredAt': null,
                            'answered': false
                        })
                    } catch(error) {
                        log.error(`The combination of ${currencies[i]} and ${currencies[j]} exists in populateCommunityRatings!`, error)
                    }
                }
            }
        }
    },
    getLastCommunityAnswer: () => {
        return Ratings.find({
            $or: [{
                catagory: 'community'
            }, {
                context: 'community'
            }]
        }, {
            sort: {
                answeredAt: -1
            }
        }).fetch()[0]
    },
    deleteCommunityRatings: () => {
        let rem = Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                catagory: 'community'
            }, {
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                context: 'community'
            }]
        }).fetch()

        let reward = rem.reduce((i1, i2) => i1 + (i2.reward || 0), 0)

        Ratings.update({ 
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                catagory: 'community'
            }, {
                owner: Meteor.userId(),
                processed: false,
                context: 'community'
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

        removeUserCredit(reward, Meteor.userId(), 'cheating on community questions','cheating')

        Meteor.call('userStrike', Meteor.userId(), 'cheating', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here
    },
    answerCommunityRating: function(ratingId, winner) {
        let rating = Ratings.findOne({
            _id: ratingId
        }) || {}

        if (rating.owner === this.userId) {
            let loser = ''

            if (winner === 'tie') {
                loser = 'tie'
            } else {
                loser = rating.currency0Id

                if(loser === winner) {
                    loser = rating.currency1Id
                }
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

            Ratings.upsert({
                _id: ratingId
            }, {
                $set: {
                    answered: true,
                    winner: winner,
                    loser: loser,
                    answeredAt: new Date().getTime()
                }
            })

            Meteor.call('getCommunityReward', Meteor.userId(), ratingId, (err, data) => {
                console.log(data)

                Ratings.update({
                    _id: ratingId
                }, {
                    $set: {
                        reward: data // save the reward so we can remove it later on if needed
                    }
                })

                creditUserWith(data, Meteor.userId(), 'answering a community question','anwserQuestion')
            })
        }
    }, 
     uploadCommunityPicture: (fileName, binaryData, md5) => {
        let md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString()
        if (md5validate !== md5) {
            throw new Meteor.Error('Error.', 'Failed to validate md5 hash.')
            return false
        }
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'You must be logged in to do this.');
            return false
        }

        const fs = require('fs')

        let mime = require('mime-types')
        let mimetype = mime.lookup(fileName)
        let validFile = _supportedFileTypes.includes(mimetype)
        let fileExtension = mime.extension(mimetype)
        let filename_thumbnail = `${_communityUploadDirectory}${md5}_thumbnail.${fileExtension}`
        let filename = `${_communityUploadDirectory}${md5}.${fileExtension}`

        let insert = false

        if (!validFile) {
            throw new Meteor.Error('Error.', 'File type not supported, png, gif and jpeg supported');
            return false
        }

        fs.writeFileSync(filename, binaryData, {
            encoding: 'binary'
        }, Meteor.bindEnvironment((error) => {
            if (error) {
                log.error('Error in uploadProfilePicture', error)
            }
        }))

          var size = { width: 200, height: 200 };
  gm(filename)
      .resize(size.width, size.height + ">")
      .gravity('Center')
      .write(filename_thumbnail, function(error) {
          if (error) console.log('Error - ', error);
      });

    },
})
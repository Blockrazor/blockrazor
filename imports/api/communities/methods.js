import { Meteor } from 'meteor/meteor'
import { UserData, Currencies, Communities, developmentValidationEnabledFalse, Ratings, RatingsTemplates, Bounties, REWARDCOEFFICIENT  } from '/imports/api/indexDB'
import SimpleSchema from 'simpl-schema'; //you must import SimpleSchema 
import { creditUserWith, removeUserCredit, log } from '/imports/api/utilities.js'
import { sendMessage } from '/imports/api/activityLog/methods'

//Define a ValidatedMethod which can be called from both the client and server 
export const saveCommunity = new ValidatedMethod({
    name: 'saveCommunity',
    //Define the validation rules which will be applied on both the client and server
    validate:
        new SimpleSchema({
            currencyId: { type: String, max: 17, optional: false},
            url: {type: String, regEx:SimpleSchema.RegEx.Url, optional: false},
            image: {label:'Your Image',type: String, optional: false, regEx: /\.(gif|jpg|jpeg|tiff|png)$/
},
        }, { requiredByDefault: developmentValidationEnabledFalse }).validator(),
    run({ currencyId,url,image }) {
    	//Define the body of the ValidatedMethod, e.g. insert some data to a collection
        if (Meteor.userId()) {
            Meteor.call('parseCommunityUrl', url, (err, data) => {
                if (!err) {
                    if (!data || !data.error) {
                        data = data || {}
                        
                        Communities.insert({
                            'url': url,
                            'currencyId': currencyId,
                            'currencyName': Currencies.findOne({
                                _id: currencyId
                            }).currencyName,
                            'createdAt': new Date().getTime(),
                            'createdBy': Meteor.userId(),
                            'image': image,
                            'approved': false,
                            size: data.size || 0,
                            time: data.time || 0
                        })
                    } else {
                        throw new Meteor.Error('Error.', 'messages.communities.invalid')
                    }
                }
            })
        } else {
            throw new Meteor.Error('Error.', 'messages.login')
        }
    }
})


Meteor.methods({
    parseCommunityUrl: (url) => {
        const Future = require('fibers/future')
        const fut = new Future()

        if (/reddit.com\/r/ig.test(url)) {
            HTTP.call('GET', `${url.replace(/\/+$/, '')}/about.json`, (err, data) => {
                if (!err) {
                    let d = data.data.data

                    fut.return({
                        size: d.subscribers,
                        time: d.created_utc * 1000 // convert to MS
                    })
                } else {
                    fut.return({
                        error: err
                    })
                }
            })
        } else if (/twitter.com/ig.test(url)) {
            let username = url.replace(/((http|https):\/\/)?twitter.com\//, '').replace(/\/+$/, '').replace(/\?.*/, '')

            HTTP.call('GET', `https://api.twitter.com/1.1/users/lookup.json?screen_name=${username}`, {
                headers: {
                    'Authorization': `Bearer AAAAAAAAAAAAAAAAAAAAALfc1AAAAAAAkVMdkPrqQm0284KyZTly7ZzulF8%3Dkp4DtlLwHFzzWm6s2mbOlP2oujvhbOyIMRazpLzKtHlyNe0yrY`
                }
            }, (err, data) => {
                if (!err) {
                    let d = data.data[0]

                    fut.return({
                        size: d.followers_count,
                        time: new Date(d.created_at).getTime()
                    })
                } else {
                    fut.return({
                        error: err
                    })
                }
            })
        } else {
            fut.return({})
        }

        return fut.wait()
    },
    getCommunityReward: (userId, rId) => {
        let bounty = Bounties.findOne({
            userId: userId,
            type: 'new-community'
        }, {
            sort: {
                expiresAt: -1
            }
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
            }],
            owner: userId
        }).count()

        let rCount = Ratings.find({
            $or: [{
                processed: false,
                catagory: 'community'
            }, {
                processed: false,
                context: 'community'
            }],
            owner: userId
        }).count()

        if (bounty) {
            if (!count) {
                Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {}) // delete the bounty, we're done with it
            }

            if (bounty.expiresAt < r.answeredAt) {
                console.log('already expired')
                return (((Date.now() - lastCommunityAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3) / (rCount || 1)
            } else {
                console.log('actual bounty')
                Meteor.call('saveLastData', bounty._id, new Date().getTime(), (err, data) => {})
                return Number(bounty.currentReward) / (rCount || 1)
            }
        } else {
            console.log('no bounty')
            return (((Date.now() - lastCommunityAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3) / (rCount || 1)
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
            throw new Meteor.Error('Error.', 'messages.communities.invalid_md5')
            return false
        }
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'messages.login');
            return false
        }

        const fs = require('fs')

        let mime = require('/imports/api/miscellaneous/mime').default
        let mimetype = mime.lookup(fileName)
        let validFile = _supportedFileTypes.includes(mimetype)
        let fileExtension = mime.extension(mimetype)
        let filename_thumbnail = `${_communityUploadDirectory}${md5}_thumbnail.${fileExtension}`
        let filename = `${_communityUploadDirectory}${md5}.${fileExtension}`

        let insert = false

        if (!validFile) {
            throw new Meteor.Error('Error.', 'messages.communities.invalid_file');
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
    flagCommunityImage: function(imageId,rejectReason) {
        if (!this.userId) {
            throw new Meteor.Error('error', 'messages.login')
        }

        let community = Communities.findOne({
            _id: imageId
        })

        if (community) {
            //send a notification to the user letting them know their image has been rejected
            sendMessage(community.createdBy, ("The community image you submitted for " + community.currencyName + " has been rejected by a moderator. The moderators reasons is: " + rejectReason))

            let ratings = Ratings.find({
                $and: [{
                    $or: [{
                        currency0Id: community.currencyId
                    }, {
                        currency1Id: community.currencyId
                    }]
                }, {
                    $or: [{
                        catagory: 'community'
                    }, {
                        context: 'community'
                    }]
                }, {
                    owner: community.createdBy,
                    processed: false
                }]
            }).fetch() // get all unprocessed ratings associated with this community

            let reward = ratings.reduce((i1, i2) => i1 + (i2.reward || 0), 0)

            removeUserCredit(reward, Meteor.userId(), 'posting an invalid community screenshot','cheating') // remove all credit user has gained from this

            Ratings.remove({
                _id: {
                    $in: ratings.map(i => i._id)
                }
            }) // remove only unprocessed ratings associated with this community, as processed ones are already part of the ELO calculation and can't be removed

            Meteor.call('userStrike', Meteor.userId(), 'bad-community', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here

            Communities.remove({
                _id: imageId
            }) // finally,remove the offending community so the user can add a new one in it's place

            

        }
    },
    approveCommunityImage: function(imageId) {
        if (!this.userId) {
            throw new Meteor.Error('error', 'messages.login')
        }

        if (Communities.findOne({_id: imageId}).createdBy === this.userId) {
            throw new Meteor.Error('Error', 'messages.communities.approve_own')
        }

        Communities.update({
            _id: imageId
        }, {
            $set: {
                approved: true,
                approvedBy: this.userId
            },
            $inc: {
                likes: 1
            }
        })
    }
})
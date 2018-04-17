import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Bounties, REWARDCOEFFICIENT, UserData, Developers, Codebase, Currencies, Ratings, RatingsTemplates } from '/imports/api/indexDB.js'
import { creditUserWith, removeUserCredit } from '/imports/api/utilities.js'
import { log } from '/imports/api/utilities'

//previously codebaserank.js in server

Meteor.methods({
    applyDeveloper: (proof) => {
        if (Meteor.userId()) {
            let user = Meteor.users.findOne({
                _id: Meteor.userId()
            })

            let username = user.username || user._id 

            Developers.insert({
                userId: Meteor.userId(),
                username: username,
                processed: false,
                proofs: proof
            })
        } else {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }
    },
    reviewDeveloper: (userId, status) => {
        if (Meteor.userId()) {
            let udata = UserData.findOne({
                _id: Meteor.userId()
            })

            if (udata && udata.developer) {
                UserData.upsert({
                    _id: userId
                }, {
                    $set: {
                        developer: status
                    }
                })

                Developers.update({
                    userId: userId
                }, {
                    $set: {
                        processed: true
                    }
                }, {
                    multi: true
                })
            } else {
                throw new Meteor.Error('Error.', 'You cannot review another developer if you\'re not a developer.')
            }
        } else {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }
    },
    getCodebaseReward: (userId, rId) => {
        let bounty = Bounties.findOne({
            userId: userId,
            type: 'new-codebase'
        }, {
            sort: {
                expiresAt: -1
            }
        })

        let lastCodebaseAnswer = Ratings.find({
            $or: [{
                catagory: 'codebase'
            }, {
                context: 'codebase'
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
                catagory: 'codebase'
            }, {
                answered: false,
                context: 'codebase'
            }],
            owner: userId
        }).count()

        let rCount = Ratings.find({
            $or: [{
                processed: false,
                catagory: 'codebase'
            }, {
                processed: false,
                context: 'codebase'
            }],
            owner: userId
        }).count()

        if (bounty) {
            if (!count) {
                Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {}) // delete the bounty, we're done with it
            }

            if (bounty.expiresAt < r.answeredAt) {
                console.log('already expired')
                return (((Date.now() - lastCodebaseAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3) / (rCount || 1)
            } else {
                console.log('actual bounty')
                Meteor.call('saveLastData', bounty._id, new Date().getTime(), (err, data) => {})
                return Number(bounty.currentReward) / (rCount || 1)
            }
        } else {
            console.log('no bounty')
            return (((Date.now() - lastCodebaseAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3) / (rCount || 1)
        }
    },
    populateCodebaseRatings: function() {
        let codebase = Codebase.find({
            createdBy: this.userId
        }).fetch()

        let currencies = _.uniq(codebase.map(i => i.currencyId))

        let ratingTemplates = RatingsTemplates.find({
            $or: [{
                catagory: 'codebase'
            },
            {
                context: 'codebase'
            }]
        }).fetch()

        let userInt = parseInt(`0x${CryptoJS.MD5(this.userId).toString().slice(0,10)}`, 16)

        for (i = 0; i < currencies.length - 1; i++) {
            for (j = i + 1; j < currencies.length; j++) {
                let dec_i = parseInt(`0x${CryptoJS.MD5(currencies[i]).toString().slice(0,10)}`, 16)
                var dec_j = parseInt(`0x${CryptoJS.MD5(currencies[j]).toString().slice(0,10)}`, 16)
                let _id = dec_i + dec_j + userInt
                for (k in ratingTemplates) {
                    id = `${(_id + parseInt(ratingTemplates[k]._id, 10)).toString()}code`
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
                            'type': 'codebase',
                            'answeredAt': null,
                            'answered': false
                        })
                    } catch(error) {
                        log.error(`The combination of ${currencies[i]} and ${currencies[j]} exists in populateCodebaseRatings!`, error)
                    }
                }
            }
        }
    },
    getLastCodebaseAnswer: () => {
        return Ratings.find({
            $or: [{
                catagory: 'codebase'
            }, {
                context: 'codebase'
            }]
        }, {
            sort: {
                answeredAt: -1
            }
        }).fetch()[0]
    },
    deleteCodebaseRatings: () => {
        let rem = Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                catagory: 'codebase'
            }, {
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                context: 'codebase'
            }]
        }).fetch()

        let reward = rem.reduce((i1, i2) => i1 + (i2.reward || 0), 0)

        Ratings.update({ 
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                catagory: 'codebase'
            }, {
                owner: Meteor.userId(),
                processed: false,
                context: 'codebase'
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

        removeUserCredit(reward, Meteor.userId(), 'cheating on codebase questions','cheating')

        Meteor.call('userStrike', Meteor.userId(), 'cheating', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here
    },
    answerCodebaseRating: function(ratingId, winner) {
        let rating = Ratings.findOne({
            _id: ratingId
        })
    
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

            Meteor.call('getCodebaseReward', Meteor.userId(), ratingId, (err, data) => {
                console.log(data)

                Ratings.update({
                    _id: ratingId
                }, {
                    $set: {
                        reward: data // save the reward so we can remove it later on if needed
                    }
                })

                creditUserWith(data, Meteor.userId(), 'answering a codebase question','anwserQuestion')
            })
        }
    },
    saveCodebase: (currencyId, codebase) => {
        if (Meteor.userId()) {
            Codebase.insert({
                'url': codebase,
                'currencyId':currencyId,
                'currencyName': Currencies.findOne({
                    _id:currencyId
                }).currencyName,
                'createdAt': new Date().getTime(),
                'createdBy': Meteor.userId()
            })
        } else {
            throw new Meteor.Error('Error.', 'You have to be logged in.')
        }
    }
})
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { UserData } from '../../lib/database/UserData'
import { Developers } from '../../lib/database/Developers'
import { Codebase } from '../../lib/database/Codebase'
import { Currencies } from '../../lib/database/Currencies.js'
import { Ratings } from '../../lib/database/Ratings.js'
import { RatingsTemplates } from '../../lib/database/Ratings.js'
import { log } from '../main'

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
    deleteCodebaseRatings: () => {
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
                loser: null
            }
        }, {
            multi: true
        }) // reset only ratings from this session, don't reset already processed ratings, as this would mess up previous ELO calculations

        // when bounties for wallet, community and codebase ratings are implemented, purge them here...
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
                    }) // get the rating on same currency pair

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
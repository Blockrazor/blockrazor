import { Meteor } from 'meteor/meteor'
import { Currencies, Summaries, UserData } from '/imports/api/indexDB.js'
import { checkCaptcha } from '/imports/api/miscellaneous/methods'

Meteor.methods({
    summaryVote: function(id, direction) {
        if (this.userId) {
            let summary = Summaries.findOne({
                _id: id
            }) 

            if (_.include(summary.appealVoted, this.userId)) {
                throw new Meteor.Error('Error', 'You can only vote once.')
            }

            Summaries.update({
                _id: id
            }, {
                $addToSet: {
                    appealVoted: this.userId
                },
                $inc: {
                    appeal: direction,
                    appealNumber: 1
                }
            })

            Summaries.upsert({
                _id: id
            }, {
                $set: {
                    rating: summary.appeal / summary.appealNumber
                }
            })
        } else {
            throw new Meteor.Error('Error', 'You must be signed in to rate something')
        }
    },
    newSummary: function(coinId, summary, captcha) {
        if (this.userId) {
            if (typeof summary != 'string') {
                throw new Meteor.Error('Error', 'Error')
            }
            
            if(summary.length > 500 || summary.length < 10) {
                throw new Meteor.Error('Error', 'That name is too long or too short.')
            }

            let added = Summaries.find({
                createdBy: this.userId,
                currencyId: coinId
            }).count()

            let canAdd = true

            if (added > 10) { // if the user has added more than 10 items
                let last = Summaries.findOne({
                    createdBy: this.userId,
                    currencyId: coinId
                }, {
                    sort: {
                        createdAt: -1
                    }
                })

                canAdd = !(last && new Date(last.createdAt).getTime() > (new Date().getTime() - 259200000)) // 3 days have to pass between adding new if the user has added more than 10 summaries
            }

            if (canAdd) {
                const Future = require('fibers/future')
                const fut = new Future()

                checkCaptcha(captcha, fut, this.connection.clientAddress)

                if (fut.wait()) {
                    Summaries.insert({
                        currencyId: coinId,
                        currencySlug: (Currencies.findOne({
                            _id: coinId
                        }) || {}).slug,
                        summary: summary,
                        appeal: 2,
                        appealNumber: 2,
                        appealVoted: [this.userId],
                        createdAt: Date.now(),
                        author: Meteor.users.findOne({
                            _id: this.userId
                        }).username,
                        createdBy: this.userId,
                        rating: 1
                    })

                    UserData.update({
                        _id: this.userId
                    }, {
                        $push: {
                            activity: {
                                time: new Date().getTime(),
                                type: 'summary'
                            }
                        }
                    })
                }
            } else {
                throw new Meteor.Error('Error.', 'You have to wait until you can post another summary.')
            }
        } else {
            throw new Meteor.Error('Error', 'You must be signed in to add a new summary')
        }
    }
})

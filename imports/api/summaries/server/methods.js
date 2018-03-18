import { Meteor } from 'meteor/meteor'
import { Currencies, Summaries } from '/imports/api/indexDB.js'

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
    newSummary: function(coinId, summary) {
        if (this.userId) {
            if (typeof summary != 'string') {
                throw new Meteor.Error('Error', 'Error')
            }
            
            if(summary.length > 500 || summary.length < 10) {
                throw new Meteor.Error('Error', 'That name is too long or too short.')
            }

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
        } else {
            throw new Meteor.Error('Error', 'You must be signed in to add a new summary')
        }
    }
})

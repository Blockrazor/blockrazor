import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Currencies } from '../../lib/database/Currencies.js'
import { Ratings } from '../../lib/database/Ratings.js'
import { RatingsTemplates } from '../../lib/database/Ratings.js'
import { log } from '../main'

Meteor.methods({
    populateDecentralizationRankings: function(list) {
        let currencies = _.uniq(_.union(Ratings.find({
            owner: this.userId,
            catagory: 'decentralization'
        }).fetch().map(i => i.currency0Id), list))

        let ratingTemplates = RatingsTemplates.find({
            catagory: 'decentralization'
        }).fetch()

        let userInt = parseInt(`0x${CryptoJS.MD5(this.userId).toString().slice(0,10)}`, 16)

        for (i = 0; i < currencies.length; i++) {
            let dec_i = parseInt(`0x${CryptoJS.MD5(currencies[i]).toString().slice(0,10)}`, 16)
            let _id = dec_i + userInt
            for (k in ratingTemplates) {
                id = `${(_id + parseInt(ratingTemplates[k]._id, 10)).toString()}`
                try {
                    Ratings.insert({
                        _id: id,
                        'owner': this.userId,
                        'currency0Id': currencies[i],
                        'questionId': ratingTemplates[k]._id,
                        'questionText': ratingTemplates[k].question,
                        'createdAt': new Date().getTime(),
                        'processedAt': null,
                        'processed': false,
                        'catagory': ratingTemplates[k].catagory,
                        'type': 'decentralization',
                        'answeredAt': null,
                        'answered': false
                    })
                } catch(error) {
                    log.error(`The ${currencies[i]} exists in populatedecentralizationRankings!`, error)
                }
            }
        }
    },
    answerDecentralizationRanking: function(ratingId, answer) {
        let rating = Ratings.findOne({
            _id: ratingId
        })

        let q = RatingsTemplates.findOne({
            _id: rating.questionId
        })

        if (rating.owner === this.userId) {
            Currencies.update({
                _id: rating.currency0Id
            }, {
                $inc: {
                    decentralizationRanking: (q.negative && !answer || answer) ? 5 : -5
                }
            })

            Ratings.update({
                _id: ratingId
            }, {
                $set: {
                    answered: true,
                    processed: true,
                    answeredAt: new Date().getTime(),
                    processedAt: new Date().getTime()
                }
            })
        }
    }
})
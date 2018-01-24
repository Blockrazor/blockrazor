import { Meteor } from 'meteor/meteor'
import { Currencies } from '../../lib/database/Currencies.js'
import { Communities } from '../../lib/database/Communities.js'
import { Ratings } from '../../lib/database/Ratings.js'
import { RatingsTemplates } from '../../lib/database/Ratings.js'
import { log } from '../main'

Meteor.methods({
    populateCommunityRatings: function() {
        let communities = Communities.find({
            createdBy: this.userId
        }).fetch()

        let currencies = _.uniq(communities.map(i => i.currencyId))

        //fetch the questions that will be asked of the user
        let ratingTemplates = RatingsTemplates.find({
            catagory: 'community'
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
    answerCommunityRating: function(ratingId, winner) {
        if (Ratings.findOne({
            _id: ratingId
        }).owner === this.userId) {
            let loser = ''

            if (winner === 'tie') {
                loser = 'tie'
            } else {
                loser = Ratings.findOne({
                    _id: ratingId
                }).currency0Id

                if(loser === winner) {
                    loser = Ratings.findOne({
                        _id: ratingId
                    }).currency1Id
                }
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
    saveCommunity: (currencyId, communityUrl) => {
        if (Meteor.userId()) {
            Communities.insert({
                'url': communityUrl,
                'currencyId':currencyId,
                'currencyName': Currencies.findOne({
                    _id:currencyId
                }).currencyName,
                'createdAt': new Date().getTime(),
                'createdBy': Meteor.userId()
            })
        }
    }
})
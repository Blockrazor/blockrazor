import { EloRankings, Ratings, RatingsTemplates, Currencies, GraphData, Communities, Bounties, WalletImages } from '/imports/api/indexDB.js';
import { log } from '/imports/api/utilities'

SyncedCron.add({
    name: 'Update graph ELO data',
    schedule: parser => parser.text('every 10 minutes'),
    job: () => Meteor.call('updateGraphdata', (err, data) => {})
})

SyncedCron.add({
    name: 'Average ELO rankings',
    schedule: parser => parser.text('every 10 minutes'),
    job: () => ['wallet', 'community', 'codebase', 'decentralization'].forEach(i => Meteor.call('averageElo', i, (err, data) => {}))
})

SyncedCron.add({
    name: 'Count ELO rankings',
    schedule: parser => parser.text('every 10 minutes'),
    job: () => Meteor.call('eloCount', (err, data) => {})
})

Meteor.methods({
    updateGraphdata: () => {
        let currencies = Currencies.find().fetch()

        let ratings = {}
        let commits = []
        let power = []

        let pos = ['wallet', 'community', 'codebase', 'decentralization', 'elo']

        currencies.forEach(i => {
            commits.push(i.gitCommits || 0)
            power.push(i.hashpower || 0)

            pos.forEach(j => {
                let min = j === 'elo' ? 0 : 400

                ratings[j] = ratings[j] || []
                ratings[j].push(i[`${j}Ranking`] || min) // apparently there's a chance that ...Ranking is undefined, so we have to have a default value here as well       
            })
        })

        pos.forEach(i => {
            let min = i === 'elo' ? 0 : 400 // default value
            let max = i === 'elo' ? 0 : 400

            if (!_.isEmpty(ratings[i])) { // if the array is empty, we get -Infinity to Infinity, which is incorrect, so we have to check whether the array is empty or not
                min = _.min(ratings[i])
                max = _.max(ratings[i])
            }

            GraphData.upsert({
                _id: 'elodata'
            }, {
                $set: {
                    [`${i}MinElo`]: min,
                    [`${i}MaxElo`]: max
                }
            })
        })

        let min = 0
        let max = 0

        if (!_.isEmpty(commits)) {
            min = _.min(commits)
            max = _.max(commits)
        }

        GraphData.upsert({
            _id: 'elodata'
        }, {
            $set: {
                'developmentMinElo': min,
                'developmentMaxElo': max
            }
        })

        min = 0
        max = 0

        if (!_.isEmpty(power)) {
            min = _.min(power)
            max = _.max(power)
        }

        GraphData.upsert({
            _id: 'elodata'
        }, {
            $set: {
                'hashpowerMinElo': min,
                'hashpowerMaxElo': max
            }
        })
    },
    eloCount: () => {
        let currencies = Currencies.find({}).fetch()
        let graphdata = GraphData.findOne({
            _id: 'elodata'
        })

        currencies.forEach(i => {
            let ratings = EloRankings.find({
                currencyId: i._id
            }).count()

            if (i.gitCommits || i.gitCommits === 0) { // if it has this field, the github url is valid and functional, as it can be fetched with the API (0 can still be a valid result)
                ratings += (graphdata.eloMaxElo * 0.8) / 4 // increase the rating by 25% of the max rating if the github URL is ok
            }

            Currencies.upsert({
                _id: i._id
            }, {
                $set: {
                    eloRanking: ratings
                }
            })
        })

        Meteor.call('updateGraphdata', (err, data) => {}) // ensure that radar graph upper and lower bounds are correct
    },
    averageElo: (type) => {
        if (!~['wallet', 'community', 'codebase', 'decentralization'].indexOf(type)) {
            throw new Meteor.Error('Error.', 'Invalid type.')
        }
        
        let currencies = Currencies.find({}).fetch()

        currencies.forEach(i => {
            let ratings = EloRankings.find({
                currencyId: i._id,
                catagory: type
            }).fetch()

            let ratingArray = []
            let final = 0
            let mul = 1

            if (type === 'community') {
                let communities = Communities.find({
                    currencyId: i._id
                }).fetch()

                let maxRatio = communities.reduce((i1, i2) => {
                    let ratio = i2.time ? i2.size / (i2.time / (60*60*24*1000)) : 0 // time in days

                    if (ratio > i1) {
                        return ratio
                    } 

                    return i1
                }, 0) // get the community with highest ratio

                if (maxRatio > 1) { // probably needs adjustments
                    mul = 1.2 // increase rankings by 20%
                }
            }

            ratings.forEach((j, ind) => {
                ratingArray.push(j.ranking * mul)

                if (parseInt(ind) + 1 === ratings.length) {
                    let sum = _.reduce(ratingArray, (memo, num) => memo + num, 0)

                    final = Math.floor(sum / (ratings.length))

                    Currencies.upsert({
                        _id: i._id
                    }, {
                        $set: {
                            [`${type}Ranking`]: final
                        }
                    })
                }
            })
        })

        Meteor.call('updateGraphdata', (err, data) => {}) // ensure that radar graph upper and lower bounds are correct
    },
  'tabulateElo': function() {
    //Import Elo ranking logic
    var Elo = require('../libs/elo.js');
    //Update the EloRankings db to make sure all currencies are included
    //each question for each currency needs an elo ranking - each question is a different game

    //Initiate elo ranking at 400
    var currencies = Currencies.find().fetch();
    var questions = RatingsTemplates.find().fetch();
    for (item in currencies) {
      var currency = currencies[item];
      for (q in questions) {
        //create unique ID for each ELO ranking 'player'
        var qid = questions[q]._id;
        var cid = currency._id;
        var id = qid.toString().substr(qid.length - 5) + cid.toString().substr(cid.length - 5);
        try {
          EloRankings.insert({
            _id: id,
            currencyName: currency.currencyName,
            currencyId: cid,
            question: questions[q].question,
            questionId: qid,
            catagory: questions[q].catagory,
            ranking: 400
            })
        } catch(err) {
          // log.error('Error in tabulateElo.', err)
        }
      }
    }

    var ratings = Ratings.find({processed: false, answered: true }).fetch()

    ratings = ratings.filter(i => { // filter out ratings that are not ready for processing
        let bounty = Bounties.findOne({ // check if question is answered in a running bounty, and don't process it if it is
            $or: [{
                type: `new-${i.catagory}`,
            }, {
                type: `new-${i.context}`
            }],
            userId: i.owner,
            expiresAt: {
                $gt: new Date().getTime()
            }
        }, {
            sort: {
                expiresAt: -1
            }
        })

        if (bounty) {
            return i.answeredAt > bounty.createdAt && i.answeredAt < bounty.expiresAt // question was answered in this time period 
        }

        if (i.catagory === 'community' || i.context === 'community') {
            let community = Communities.find({
                $or: [{
                    currencyId: i.currency0Id
                }, {
                    currencyId: i.currency1Id
                }]
            }).fetch()

            return !community.length || community.every(i => !!i.approved) // don't process communities that haven't been approved already
        }

        if (i.catagory === 'wallet' || i.context === 'wallet') {
            let wallet = WalletImages.find({
                $or: [{
                    currencyId: i.currency0Id
                }, {
                    currencyId: i.currency1Id
                }]
            }).fetch()

            return !wallet.length || wallet.every(i => !!i.approved) // don't process wallets that haven't approved
        }

        return true
    })

    for (item in ratings) {
      //console.log(ratings[item]._id);
      rating = ratings[item];
      var elo = new Elo();
      var loserRanking = false;
      var winnerRanking = false;
      if(rating.winner && rating.loser && rating.winner !== "tie") {
        //questionId
        //winner (Id)
        var winnerEloId = rating.questionId.toString().substr(rating.questionId.length - 5) + rating.winner.toString().substr(rating.winner.length - 5);
        var loserEloId = rating.questionId.toString().substr(rating.questionId.length - 5) + rating.loser.toString().substr(rating.loser.length - 5);

        let question = RatingsTemplates.findOne({
          _id: ratings[item].questionId
        })
        if (question && question.negative) {
          let tmp = loserEloId
          loserEloId = winnerEloId
          winnerEloId = tmp
        }

        loserRanking = EloRankings.findOne({_id: loserEloId}).ranking;
        winnerRanking = EloRankings.findOne({_id: winnerEloId}).ranking;
        
        console.log(winnerEloId);
        var result = elo.newRatingIfWon(winnerRanking, loserRanking);
        EloRankings.upsert({_id: winnerEloId}, {$set: {
          ranking: result
        }})
      }
      Ratings.upsert({_id: rating._id}, {$set: {
        processed: true
      }})
    }
  }
})

//Add method to average all elo rankings for each currency in different
//catagories (wallet, community, codebase) and denormalize results into currency databse

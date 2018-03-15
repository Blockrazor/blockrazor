import { EloRankings, Ratings, RatingsTemplates, Currencies, GraphData } from '/imports/api/indexDB.js';
import { log } from '../main'

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

        let pos = ['wallet', 'community', 'codebase', 'decentralization', 'elo']

        currencies.forEach(i => {
            commits.push(i.gitCommits || 0)

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
    },
    eloCount: () => {
        let currencies = Currencies.find({}).fetch()

        currencies.forEach(i => {
            let ratings = EloRankings.find({
                currencyId: i._id
            }).count()

            Currencies.upsert({
                _id: i._id
            }, {
                $set: {
                    [`eloRanking`]: ratings
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

            ratings.forEach((j, ind) => {
                ratingArray.push(j.ranking)

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

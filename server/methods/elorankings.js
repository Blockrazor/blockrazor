import { EloRankings, Ratings, RatingsTemplates } from '../../lib/database/Ratings.js';
import { Currencies } from '../../lib/database/Currencies.js';
import { GraphData } from '../../lib/database/GraphData.js'
import { log } from '../main'

Meteor.methods({
  averageEloCommunity: () => {
    let currencies = Currencies.find().fetch()
    let allRatings = []

    currencies.forEach(i => {
      let ratings = EloRankings.find({
        currencyId: i._id,
        catagory: 'community'
      }).fetch()

      let ratingArray = []
      let final = 0
  
      ratings.forEach((j, ind) => {
        ratingArray.push(j.ranking)

        if (parseInt(ind) + 1 === ratings.length) {
          let sum = _.reduce(ratingArray, (memo, num) => memo + num, 0)

          final = Math.floor(sum / (ratings.length))

          allRatings.push(final)

          Currencies.upsert({
            _id: i._id
          }, {
            $set: {
              communityRanking: final
            }
          })
        }
      })
    })
    GraphData.upsert({
      _id: 'elodata'
    }, {
      $set: {
        communityMinElo: _.min(allRatings),
        communityMaxElo: _.max(allRatings)
      }
    })
  },
  averageEloWallet: function() {
    var currencies = Currencies.find().fetch();
    var allRatings = [];
    for (c in currencies) {
      var ratings = EloRankings.find({
        currencyId: currencies[c]._id,
        catagory: 'wallet'
      }).fetch();
      var length = ratings.length;
      var ratingArray = [];
      var final = 0;

      for (r in ratings) {
        ratingArray.push(ratings[r].ranking);
        //console.log(parseInt(r) + 1);
        //console.log(length);
        //console.log("----------");
        if(parseInt(r) + 1 == length) {
          //average the total array
          var sum = _.reduce(ratingArray, function(memo, num){ return memo + num; }, 0);
          final = Math.floor(sum / (length));
          allRatings.push(final);
          Currencies.upsert({_id: currencies[c]._id}, {$set: {
            walletRanking: final
          }})
        }
      }
    }
    GraphData.upsert({_id: "elodata"}, {$set: {
      walletMinElo: _.min(allRatings),
      walletMaxElo: _.max(allRatings)
    }})
     //{catagory: "wallet"}
    //for (w in wallets) {
      //console.log(wallets[w].currencyName + " " + wallets[w].ranking);

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
          log.error('Error in tabulateElo.', err)
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
      if(rating.winner != "tie") {
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
        }
        console.log(winnerEloId);
        var result = elo.newRatingIfWon(winnerRanking, loserRanking);
        EloRankings.upsert({_id: winnerEloId}, {$set: {
          ranking: result
        }})
        Ratings.upsert({_id: rating._id}, {$set: {
          processed: true
        }})
      }
  }
})

//Add method to average all elo rankings for each currency in different
//catagories (wallet, community, codebase) and denormalize results into currency databse

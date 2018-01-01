import { EloRankings, Ratings, RatingsTemplates } from '../../lib/database/Ratings.js';
import { Currencies } from '../../lib/database/Currencies.js';


Meteor.methods({
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
            ranking: 400
            })
        } catch(err) {
          //console.log(err); //FIXME add to loggig system
        }
      }
    }



    var ratings = Ratings.find({processed: false, answered: true }).fetch();
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

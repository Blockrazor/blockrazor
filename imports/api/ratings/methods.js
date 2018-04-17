import { Meteor } from 'meteor/meteor'
import { Ratings, RatingsTemplates, UserData, WalletImages } from '/imports/api/indexDB.js'
import { creditUserWith, removeUserCredit } from '/imports/api/utilities.js'
import { log } from '/imports/api/utilities'

Meteor.methods({
	answerRating: function(ratingId, winner) {
		let rating = Ratings.findOne({_id:ratingId})

		if (rating.owner == this.userId) {
			var loser = rating.currency0Id;

			if(loser == winner) {
				loser = rating.currency1Id;
			}

			if(winner == "tie") {
				loser = "tie";
			}

			let question = RatingsTemplates.findOne({
				_id: rating.questionId
			})

			if (question !== undefined) {
				if (question.xors) {
					question.xors.forEach(i => {
						let q = RatingsTemplates.findOne({ _id: i })
						let r = Ratings.findOne({
							questionId: i,
							currency0Id: rating.currency0Id,
							currency1Id: rating.currency1Id
						}) || {} // get the rating on same currency pair

						let bo = true
						if (q !== undefined) {
							if ((!q.negative && question.negative) || (q.negative && !question.negative)) { // XOR
								bo = false
							}
						}

						if (r.answered) {
							if (winner !== 'tie' && r.winner !== 'tie' && ((bo && (winner !== r.loser || loser !== r.winner)) || (!bo && (winner !== r.winner || loser !== r.loser)))) {
								throw new Meteor.Error('Error.', 'xor')
							}
						}
					})
				}
			}

			Ratings.upsert({_id:ratingId}, {
				$set: {
					answered: true,
					winner: winner,
					loser: loser,
					answeredAt: new Date().getTime()
				}
			})

			Meteor.call('getWalletReward', Meteor.userId(), ratingId, (err, data) => {
				console.log(data)
				Ratings.update({
					_id: ratingId
				}, {
					$set: {
						reward: data // save the reward so we can remove it later on if needed
					}
				})

				creditUserWith(data, Meteor.userId(), 'answering a wallet question','answerQuestion')
			})
		}
    },

	addRatingQuestion: (question, catagory, negative, context, xors) => {
		console.log("addRatingQuestion has been called");
		if (!Meteor.userId()){
			throw new Meteor.Error('Error.', 'You need to be logged.')
		}

		let id = parseInt(`0x${CryptoJS.MD5(question).toString().slice(0,10)}`, 16).toString()

		let n = RatingsTemplates.insert({
            _id: id,
            question: question,
            catagory: catagory,
            createdBy: Meteor.userId(),
            createdAt: new Date().getTime(),
            negative: !!negative,
            context: context,
            xors: xors
        })

        // XOR is symmetrical
        xors.forEach(i => {
            RatingsTemplates.update({
                _id: i
            }, {
                $push: {
                    xors: n
                }
            })
        })
	},

	deleteQuestion: (questionId) => {
		let question = RatingsTemplates.findOne({ _id: questionId })
		// you can only delete a question if you're a moderator
		var moderatorValue = UserData.findOne({ _id: Meteor.userId() }, { fields: { moderator: true } }).moderator;

		if (moderatorValue === 1) {
			RatingsTemplates.remove({ _id: questionId })
		}
	},

	toggleContextQuestion: (questionId) => {
		let question = RatingsTemplates.findOne({ _id: questionId })

		// you can only change context of a question if you're a moderator
		var moderatorValue = UserData.findOne({ _id: Meteor.userId() }, { fields: { moderator: true } }).moderator;

		if (moderatorValue === 1) {
			RatingsTemplates.update({ _id: questionId }, {
				$set: { negative: !question.negative }
			})
		}
    },

	//this will populate the ratings database for this user with any new Currencies
    //they have added, or if an admin has added new questions for their existing currencies.
	populateRatings: function() {
		//fetch all the currencies this user uses:
		var images = WalletImages.find({createdBy: this.userId,allImagesUploaded:true}).fetch();
		var currencies = [];

		for (i in images) {
			currencies.push(images[i].currencyId);
		}
		var currencies = _.uniq(currencies);

		//fetch the questions that will be asked of the user
		var ratingTemplates = RatingsTemplates.find({
			$or: [{
				catagory: 'wallet'
			},
			{
				context: 'wallet'
			}]
		}).fetch();

		var userInt = parseInt("0x" + CryptoJS.MD5(this.userId).toString().slice(0,10), 16);

		//Cycle through all possible combinations of currencies that this user has a wallet for
		for (i = 0; i < currencies.length - 1; i++) {
			for (j = i + 1; j < currencies.length; j++) {
				//we don't want to generate duplicate currency pairs for the user, the fastest way to make sure
				//is to combine the currency pairs and user ID into a number so that no matter what way
				//you combine this the result will be the same, new additions can then be compared immediately
				//and be verified unique for this user.
				var dec_i = parseInt("0x" + CryptoJS.MD5(currencies[i]).toString().slice(0,10), 16);
				var dec_j = parseInt("0x" + CryptoJS.MD5(currencies[j]).toString().slice(0,10), 16);
				//add truncated MD5 of currencyId's and userId to prevent duplicates
				var _id = dec_i + dec_j + userInt;
				//add question truncated MD5 Int to the _id
				for (k in ratingTemplates) {
					console.log(currencies[i] + " " + currencies[j] + " " + ratingTemplates[k]._id)
					id = (_id + parseInt(ratingTemplates[k]._id, 10)).toString();
					console.log(id);
					try{
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
							'type': "wallet",
							'answeredAt': null,
							'answered': false
						})
					} catch(error) {
						log.error(`the combination of ${currencies[i]} and ${currencies[j]} exists in populateRatings!`, error)
					}
				}
			}
		}
    },
});

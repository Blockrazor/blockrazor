import { Meteor } from 'meteor/meteor'
import { UserData, Wallet, Problems, ProblemImages, ProblemComments, developmentValidationEnabledFalse } from '/imports/api/indexDB'
import SimpleSchema from 'simpl-schema';

export const newProblem = new ValidatedMethod({
  name: 'newProblem',
  validate: //null,
  new SimpleSchema({
    type: {type: String, allowedValues: ['bug', 'feature', 'question']},
    header: {type: String, max: 80, /*label: "summary above 80 characters"*/}, //label makes it into the error, but it's concatenated with default error message
    text: String,
		images: {type: Array, required: false},
		"images.$": String,
    bounty: {required: false, type: Number, /*autoValue: function(){console.log(this);if (Number.isNaN(this.value)){return 0} else {return this.value}}*/}, //can't call clean() within method call
  }, {requiredByDefault: developmentValidationEnabledFalse}).validator(),
  run({ type, header, text, images, bounty }) {
			if (Meteor.userId()) {
				if (bounty > 0) { // check if the user can finance the bounty
					let user = UserData.findOne({
						_id: Meteor.userId()
					})

					if (user.balance < bounty) {
						throw new Meteor.Error('Error.', 'Insufficient funds.')
					}
				}

				Problems.insert({
					type: type,
					header: header,
					text: text,
					images: images,
					createdBy: Meteor.userId(),
					date: new Date().getTime(),
					credit: [{
						userId: Meteor.userId(),
						bounty: bounty
					}],
					open: true,
					solved: false,
					taken: {},
					locked: false,
					cancelled: false,
					votes: [],
					score: 0
				})

				if (bounty > 0) { // take the bounty from user's wallet
					UserData.upsert({
						_id: Meteor.userId()
					}, {
						$inc: {
							balance: -bounty
						}
					})

				    Wallet.insert({
				    	time: new Date().getTime(),
				    	owner: Meteor.userId(),
				    	type: 'transaction',
				      	from: 'Blockrazor',
				      	message: `KZR has been reserved from your account for funding a problem.`,
				      	amount: -bounty,
				     	read: false
				    })
				}
			} else {
				throw new Meteor.Error('Error.', 'You have to be logged in.')
			}
  }
});
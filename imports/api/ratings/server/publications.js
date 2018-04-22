import { Meteor } from 'meteor/meteor'
import { EloRankings, Ratings, RatingsTemplates } from '/imports/api/indexDB.js'

Meteor.publish('elorankings', function elorankingsPublication() {
  return EloRankings.find({});
});

Meteor.publish('ratings', function ratingsPublication() {
return Ratings.find({owner: this.userId});
})

Meteor.publish('ratings_templates', function ratings_templatesPublication() {
  return RatingsTemplates.find();
  })

Meteor.publish('addCoinQuestions', () => RatingsTemplates.find({
  context: 'add-currency'
})
);

// ['codebase', 'community', 'wallet'].forEach(type => { // this doesn't work with fastrender
	Meteor.publish(`bountyRating`, () => {
		return Ratings.find({}, {
	        sort: {
	            answeredAt: -1
	        },
	        fields: {
	        	context: 1,
	        	catagory: 1,
	        	answeredAt: 1
	        }
	    })
	})
// })
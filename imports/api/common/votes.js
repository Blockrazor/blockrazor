import { Meteor } from 'meteor/meteor'
import { Currencies, Features, Summaries, Redflags } from '/imports/api/indexDB.js'

const collections = { Features, Summaries, Redflags };

var methods = {}
methods.hasUserVoted = (collection, id, direction) => {
	var doc = collections[collection].findOne(id);

	if (direction === 'up') {
		return _.include(doc.appealVoted, Meteor.userId());
	}

	return _.include(doc.downVoted, Meteor.userId());
};

methods.vote = function(collection, id, direction) {
	if(this.userId) {
		if (methods.hasUserVoted(collection, id, direction)) { return; } // end execution if user already voted in same direction

		switch (direction) {
			case 'up':
				// check if user voted in the opposite direction
				// and retract vote if true
				if (methods.hasUserVoted(collection, id, 'down'))
					collections[collection].update(id, { $pull: {downVoted: this.userId} })

				collections[collection].update(id, {
					$addToSet: {appealVoted: this.userId},
					$inc: {appeal: 1, appealNumber: 1}
				});
				break;
			case 'down':
				// check if user voted in the opposite direction
				// and retract vote if true
				if (methods.hasUserVoted(collection, id, 'up'))
					collections[collection].update(id, { $pull: {appealVoted: this.userId} })

				collections[collection].update(id, {
					$addToSet: {downVoted: this.userId},
					$inc: {appeal: -1, appealNumber: 1}
				});
				break;
			default:
				console.log("Nothing happens here");
		}

		var doc = collections[collection].findOne(id);
		var rating = doc.appeal / doc.appealNumber;
		collections[collection].upsert(id, { $set: {rating: rating} });
	} else {
		throw new Meteor.Error('Error', 'messages.login');
	}
};

Meteor.methods(methods);

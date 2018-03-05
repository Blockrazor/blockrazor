import { Mongo } from 'meteor/mongo'

Meteor.users.friendlySlugs({
  slugFrom: 'username',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
}) // create a URL friendly slug from the username

if (Meteor.isServer) {
	Meteor.publish(null, function() { // extend the default Meteor.user() object to include the slug
		return Meteor.users.find({
			_id: this.userId
		}, {
			fields: {
				slug: 1
			}
		})
	})

	Meteor.publish('user', (slug) => {
		return Meteor.users.find({
			$or: [{
				slug: slug
			}, {
				_id: slug
			}]
		}, {
			fields: {
				username: 1,
				createdAt: 1,
				email: 1,
				bio: 1,
				slug: 1
			} // only show the absolutely required fields
		})
	})

	Meteor.startup(() => { // sluggify existing data
		Meteor.users.find({
			slug: {
				$exists: false
			}
		}).forEach(user => {
	    	Meteor.users.update({
	    		_id: user._id
	    	}, {
	    		$set: {
	    			fake: ''
	    		}
	    	})
		})
	})
}
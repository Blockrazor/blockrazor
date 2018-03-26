import { Meteor } from 'meteor/meteor'
import { UserData, ProfileImages } from '/imports/api/indexDB.js'

  Meteor.publish('profileimages', () => ProfileImages.find({}))

  Meteor.publish('userData', () => {
    let u = UserData.findOne({
      _id: Meteor.userId()
    })

    // only publish this data if the current user is a moderator
    if (u.moderator) {
      return UserData.find({}, {
        fields: {
          sessionData: 1,
          flags: 1 // publish only a limited set of fields to prevent security issues
        }
      })
    } else {
      return null // empty publish otherwise
    }
  })

  //public endpoint
  //TODO: rellies on userId, used in 
  Meteor.publish('publicUserData', () => {
    return UserData.find({
      _id: Meteor.userId()
    }, {
      fields: {
        balance: 1,
        moderator: 1,
        developer: 1,
        fullname: 1,
        profilePicture: 1,
        screenSize: 1,

      }
    })
  })

  Meteor.publish('userdataId', id => UserData.find({
    _id: id
  }, {
    fields: {
      moderator: 1,
      developer: 1,
      fullname: 1,
      profilePicture: 1,
    }
  }))

  Meteor.publish('userdataSlug', (slug) => {
    let user = Meteor.users.findOne({
      slug: slug
    })

    if (user) {
      return UserData.find({
        _id: user._id
      }, {
        fields: {
          moderator: 1,
          developer: 1,
          fullname: 1,
          profilePicture: 1,
        }
      })
    } else {
      return []
    }
  }) // publish user's public data


  Meteor.publish(null, function() { // extend the default Meteor.user() object
		return Meteor.users.find({
			_id: this.userId
		}, {
			fields: {
				username: 1,
				createdAt: 1,
				email: 1,
				bio: 1,
				slug: 1,
				profilePicture: 1
			}
		})
	})

	Meteor.publish('user', (slug) => {
		return Meteor.users.find({
			$or: [{
				slug: slug
			}, {
				_id: slug
			}, {
        username: slug
      }]
		}, {
			fields: {
				username: 1,
				createdAt: 1,
				email: 1,
				bio: 1,
				slug: 1,
				profilePicture: 1
			} // only show the absolutely required fields
		})
	})
 
  //is used to switch out accounts with constellation account module
  //you might wrap this in Meteor.isDevelopment
  Meteor.publish('users', (slug) => {
    return Meteor.users.find({}, {
      fields: {
        username: 1,
        createdAt: 1,
        email: 1,
        bio: 1,
        slug: 1,
        profilePicture: 1
      } // only show the absolutely required fields
    })
  })
import { Meteor } from 'meteor/meteor'
import { UserData, ProfileImages, UsersStats } from '/imports/api/indexDB.js'

  Meteor.publish('profileimages', () => ProfileImages.find({}))

  Meteor.publish('userData', () => {
    let u = UserData.findOne({
      _id: Meteor.userId()
    })

    // only publish this data if the current user is a moderator
    if (u && u.moderator) {
      return UserData.find({}, {
        fields: {
          sessionData: 1,
          flags: 1,
          mod: 1 // publish only a limited set of fields to prevent security issues
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
        bountyPreference: 1,
        strikes: 1,
        inputRanking: 1,
        others: 1,
        paymentId: 1
      }
    })
  })

  Meteor.publish('myUserData', () => UserData.find({
    _id: Meteor.userId()
  }, {
    fields: {
      moderator: 1,
      developer: 1,
      fullname: 1,
      profilePicture: 1,
      strikes: 1,
      pardon: 1,
      activity: 1,
      inputRanking: 1,
      others: 1,
      paymentId: 1
    }
  }))

  Meteor.publish('userdataId', id => UserData.find({
    _id: id
  }, {
    fields: {
      moderator: 1,
      developer: 1,
      fullname: 1,
      profilePicture: 1,
      strikes: 1,
      inputRanking: 1
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
          strikes: 1,
          inputRanking: 1,
          mod: 1
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
				profilePicture: 1,
        referral: 1,
        inviteCode: 1,
        suspended: 1,
        pass2fa: 1,
        enabled2fa: 1,
        backup2fa: 1
			}
		})
	})

  Meteor.publish('pardonUserData', () => {
    return UserData.find({
      'pardon.status': 'new'
    })
  })

  Meteor.publish('userdata', () => {
    return UserData.find({ })
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
				profilePicture: 1,
        suspended: 1
			} // only show the absolutely required fields
		})
	})
 
  //is used to switch out accounts with constellation account module
  Meteor.publish('users', (slug) => {
    return Meteor.users.find({}, {
      fields: {
        username: 1,
        createdAt: 1,
        email: 1,
        bio: 1,
        slug: 1,
        profilePicture: 1,
        suspended: 1
      } // only show the absolutely required fields
    })
  })

  Meteor.publish("usersStats", ()=>{
    return UsersStats.find({}, {fields: {userIds: 1, created: 1}})
  })
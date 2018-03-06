import { Mongo } from 'meteor/mongo';
export var UserData = new Mongo.Collection('userdata')

if(Meteor.isServer) {
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


Meteor.methods({
  initializeUser: function() {
    if (_.size(UserData.findOne({_id: this.userId})) == 0) {
      let u = UserData.find({
        'sessionData.loggedIP': this.connection.clientAddress
      }).count()

      let user = Meteor.users.findOne({
        _id: this.userId
      })

      const validate = require('../../imports/api/server/validate').validate // imports can only be used in the top scope

      UserData.insert({
        _id: this.userId,
        moderator: 0,
        developer: false,
        balance: 0,
        approvedCurrencies: 0,
        createdTime: new Date().getTime(),
        sessionData: [{
          loggedIP: this.connection.clientAddress,
          headerData: this.connection.httpHeaders,
          time: new Date().getTime()
        }],
        flags: {
          duplicate: {
            createdIP: !!u,
            accessIP: false,
            disposableEmail: !validate(user.email)
          }
        }
      })
    } else {
      UserData.upsert({
        _id: this.userId
      }, {
        $push: {
          sessionData: {
            loggedIP: this.connection.clientAddress,
            headerData: this.connection.httpHeaders, // this could be a problem in the future, it's quite a big object
            time: new Date().getTime()
          }
        }
      })
    }
  }
});
}

import { Meteor } from 'meteor/meteor'
import { UserData } from '/imports/api/indexDB.js'

Meteor.methods({
  sidebarPreference: function(value) {
    return UserData.update({
      _id: this.userId
    }, {
      $set: {
        screenSize: value
      }
    })
  },
  initializeUser: function() {
    if (_.size(UserData.findOne({_id: this.userId})) == 0) {
      let u = UserData.find({
        'sessionData.loggedIP': this.connection.clientAddress
      }).count()

      let user = Meteor.users.findOne({
        _id: this.userId
      })

      const validate = address => {
        address = address.split('@').pop()
      
          const disposable = require('disposable-email')
          const ourList = ['mvrht.net'] // disposable emails currently not on the list
      
          return !~ourList.indexOf(address) && disposable.validate(address)
      }
      
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

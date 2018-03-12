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
});

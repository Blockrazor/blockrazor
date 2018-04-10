import { Meteor } from 'meteor/meteor'
import { UserData } from '/imports/api/indexDB.js'

Meteor.methods({
  sidebarPreference: function(value, valueOnRecord) {
    //ignore request if valueOnRecord provided from beforeUnload hook that will not care if operations that decide if method should be called actually finish
    if (valueOnRecord && valueOnRecord == value){
      return
    }
    
    UserData.update({
      _id: this.userId
    }, {
      $set: {
        screenSize: value
      }
    })
  },
});

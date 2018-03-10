import { Meteor } from 'meteor/meteor'
import { ActivityLog } from '/imports/api/indexDB.js'

Meteor.publish('activitylog', function pending() {
  if(this.userId) {
    return ActivityLog.find({owner: this.userId});
  } else {
    return null;
  }
})
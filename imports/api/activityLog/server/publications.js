import { Meteor } from 'meteor/meteor'
import { ActivityLog, ActivityIPs } from '/imports/api/indexDB.js'

Meteor.publish('activitylog', function pending() {
  if(this.userId) {
    return ActivityLog.find({owner: this.userId});
  } else {
    return null;
  }
})

Meteor.publish('activityIPs', () => ActivityIPs.find({}))
Meteor.publish('activityIP', (ip) => ActivityIPs.find({
	ip: ip
}))
import { Mongo } from 'meteor/mongo';
export var ActivityLog = new Mongo.Collection('activitylog');

if (Meteor.isServer) {
Meteor.methods({
  initializeActivityLog: function() {
    if (_.size(ActivityLog.findOne({_id: Meteor.user()._id})) == 0) {
      ActivityLog.insert({
        _id: Meteor.user()._id,
        message: [{
          time: new Date().getTime(),
          from: "System",
          message: "Your account has been created!"
        }]
      })
      }
    }

});

Meteor.publish('activitylog', function pending() {
  if(ActivityLog.findOne({_id: Meteor.user()._id})) {
    return ActivityLog.find({_id: Meteor.user()._id});
  } else {
    return null;
  }
})
};

import { Mongo } from 'meteor/mongo';
export var ActivityLog = new Mongo.Collection('activitylog');

export var sendMessage = function(userId, message, from) {
  if(Meteor.isServer) {
  ActivityLog.insert({
    time: new Date().getTime(),
    owner: userId,
    type: "message",
    from: from ? from : "System",
    content: message
  })
}
};

if (Meteor.isServer) {
Meteor.methods({
  initializeActivityLog: function() {
    if (_.size(ActivityLog.findOne({owner: Meteor.user()._id})) == 0) {
      ActivityLog.insert({
        time: new Date().getTime(),
        owner: Meteor.user()._id,
        type: "message",
        from: "System",
        content: "Your account has been created!"
      })
      }
    }
});

Meteor.publish('activitylog', function pending() {
  if(Meteor.user()._id) {
    return ActivityLog.find({owner: Meteor.user()._id});
  } else {
    return null;
  }
})
};

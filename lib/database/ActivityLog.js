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
    if (_.size(ActivityLog.findOne({owner: this.userId})) == 0) {
      ActivityLog.insert({
        time: new Date().getTime(),
        owner: this.userId,
        type: "message",
        from: "System",
        content: "Your account has been created!"
      })
      }
    }
});

Meteor.publish('activitylog', function pending() {
  if(this.userId) {
    return ActivityLog.find({owner: this.userId});
  } else {
    return null;
  }
})
};

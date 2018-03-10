import { Meteor } from 'meteor/meteor'
import { ActivityLog } from '/imports/api/indexDB.js'

Meteor.methods({
  sendMessage: function(userId, message, from) {
    ActivityLog.insert({
      time: new Date().getTime(),
      owner: userId,
      type: "message",
      from: from ? from : "System",
      content: message
    })
  },
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

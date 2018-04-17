import { Meteor } from 'meteor/meteor'
import { ActivityLog } from '/imports/api/indexDB.js'
import { log } from '/imports/api/utilities'

export const sendMessage = function(userId, message, from) {
    ActivityLog.insert({
      time: new Date().getTime(),
      owner: userId,
      type: "message",
      from: from ? from : "System",
      content: message
    })
  }

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

Meteor.methods({
    'markNotificationsAsRead': function() {
        if (!Meteor.userId()) { throw new Meteor.Error('error', 'please log in') };

        ActivityLog.update({
            owner: Meteor.userId(),
        }, {
            $set: {
                read: true
            }
        }, {
            multi: true
        }, function(error) {
            if (error) {
                log.error('Error in markNotificationsAsRead', error)
                throw new Meteor.Error(500, error.message);
            }
        });

    }

});
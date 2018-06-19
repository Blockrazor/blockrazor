import { Template } from 'meteor/templating';
import { ActivityLog } from '/imports/api/indexDB.js';

import '/imports/ui/components/notLoggedIn.html'
import './activityLog.html'
import './messageitem'

Template.activityLog.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function() {
    SubsCache.subscribe('activitylog');
  })

// mark all notification as read
    Meteor.call('markNotificationsAsRead',
        (error, result) => {
            if (error) {
                console.error(error)
            }
        }
    );

});

Template.activityLog.onRendered( function () {
//console.log(ActivityLog.find({id}).fetch())
});

Template.activityLog.helpers({
  message(){
    return ActivityLog.find({owner: Meteor.userId(), type: "message"}, {sort: {time: -1 }});
  }
});


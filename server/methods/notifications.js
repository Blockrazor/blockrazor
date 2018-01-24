import { Meteor } from 'meteor/meteor';
import { ActivityLog } from '../../lib/database/ActivityLog.js'
import { log } from '../main'

Meteor.methods({
    'getNotificationCount': function() {
        if (!Meteor.userId()) { throw new Meteor.Error('error', 'please log in') };

        var totalNotifications = ActivityLog.find({
            owner: Meteor.userId(),
            read: { "$exists": false }
        }).count();

        return totalNotifications;

    },
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
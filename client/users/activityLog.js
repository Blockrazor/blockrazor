import { Template } from 'meteor/templating';
import { ActivityLog } from '../../lib/database/ActivityLog.js';

Template.activityLog.onCreated(function bodyOnCreated() {
  Meteor.subscribe('activitylog');
});

Template.activityLog.onRendered( function () {
//console.log(ActivityLog.find({id}).fetch())
});

Template.activityLog.helpers({
  logs() {
        //var message = ActivityLog.findOne({});
        //console.log(ActivityLog.findOne({}).message);
        //return ActivityLog.findOne({});
        return ActivityLog.findOne({}).message;
      }
});

Template.messageitem.helpers({
  time() {
    console.log(this)
        return moment(this.time).fromNow();
      }
});

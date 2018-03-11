import { ActivityLog, Wallet } from '/imports/api/indexDB.js';

import './sideNav.html'
import './sideNav.scss'

Template.sideNav.helpers({
  activityNotifications() {
    return ActivityLog.find({owner: Meteor.userId(), type: "message", read: {$ne: true}}).count();
  },
  walletNotifications(){
    return Wallet.find({owner: Meteor.userId(), type: "transaction", read: {$ne: true}}).count();
  },
});

Template.sideNav.onCreated(function() {
  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  });
});
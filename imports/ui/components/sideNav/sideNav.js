import { ActivityLog } from '../../../../lib/database/ActivityLog';
import { Wallet } from '../../../../lib/database/Wallet';

import './sideNav.html'
import './sideNav.scss'

Template.sideNav.helpers({
  activityNotifications() {
    return ActivityLog.find({owner: Meteor.userId(), type: "message", read: {$ne: true}}).count();
  },
  walletNotifications(){
    return Wallet.find({owner: Meteor.userId(), type: "transaction", read: {$ne: true}}).count();
  },
  openSidebar(){
    return "active"
    return Session.get("openedSidebar")? "active": "";
  }
});

Template.sideNav.onCreated(function() {
  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  });
});
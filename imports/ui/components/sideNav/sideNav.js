import { ActivityLog, Wallet, UserData } from '/imports/api/indexDB.js';

import './sideNav.html'
import './sideNav.scss'
import './sideNav.css'
import '../global/globalHelpers'

Template.sideNav.helpers({
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count();
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: "transaction", read: { $ne: true } }).count();
    },
    balance() {
      let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
      return Number( balance.toPrecision(3) )
    }
});

Template.sideNav.onCreated(function() {
  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  });
});

Template.sideNav.events({
  'click .side-nav-container li a': function (event){
    if (Session.get("screenSize") == 0){
      Session.set("openedSidebar")
    }
  },
});

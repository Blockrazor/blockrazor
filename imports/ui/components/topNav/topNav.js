import { ActivityLog, Wallet, UserData } from '/imports/api/indexDB.js';


import './topNav.html'
import './topNav.scss'

Template.topNav.events({
  'click #js-logout': (event, templateInstance) => {
    Meteor.logout()
  }
});

Template.topNav.helpers({
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count();
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: "transaction", read: { $ne: true } }).count();
    },
    slug: () => Meteor.users.findOne({
        _id: Meteor.userId()
    }).slug,
    balance() {
      let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
      return Number( balance.toPrecision(3) )
    }
});

Template.topNav.onCreated(function() {
  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  })
});

import {FlowRouter} from 'meteor/ostrio:flow-router-extra';


import './header.html'

Template.header.onCreated(function() {
})

Template.header.events({
    'click .sidebar-toggler': function() {
        // toggle "sidebar-show" class to show/hide sidebar
        // $('body').toggleClass("sidebar-md-show sidebar-fixed")
        
        $('body').toggleClass("app header-fixed sidebar-fixed aside-menu-fixed  sidebar-lg-show  pace-done")

    },
    'click #logout': (event, templateInstance) => {
    Meteor.logout()
  }
})

Template.header.helpers({
    shareUrl: () => `${window.location.href}#${(Meteor.users.findOne({_id: Meteor.userId()}) || {}).inviteCode}`,
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count()
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: "transaction", read: { $ne: true } }).count()
    },
    slug: () => Meteor.users.findOne({
        _id: Meteor.userId()
    }).slug,
    balance() {
      return UserData.findOne({}, { fields: { balance: 1 } }).balance
  	}
});
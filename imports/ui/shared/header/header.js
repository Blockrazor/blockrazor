import {FlowRouter} from 'meteor/ostrio:flow-router-extra';


import './header.html'

Template.header.onCreated(function() {
})

Template.header.events({
    'click .sidebar-toggler': function() {
        if ($(window).width() < 768) {
            $('body').toggleClass("sidebar-lg-show")
        } else {
            $('body').toggleClass("sidebar-md-show")
        }
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
import { ActivityLog, Wallet } from '/imports/api/indexDB.js';

Template.topnav.events({
    'click #js-logout': (event, templateInstance) => {
        Meteor.logout()
    }
});

Template.topnav.helpers({
    activityNotifications() {
        return ActivityLog.find({owner: Meteor.userId(), type: "message", read: {$ne: true}}).count();
    },
    walletNotifications(){
        return Wallet.find({owner: Meteor.userId(), type: "transaction", read: {$ne: true}}).count();
    },
    slug: () => Meteor.users.findOne({
        _id: Meteor.userId()
    }).slug
});

Template.topnav.onCreated(function() {
    this.autorun(()=> {
        SubsCache.subscribe('wallet');
        SubsCache.subscribe('activitylog');
    })
});
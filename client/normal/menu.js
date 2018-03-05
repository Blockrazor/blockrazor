import { ActivityLog } from '../../lib/database/ActivityLog.js';
import { Wallet } from '../../lib/database/Wallet.js';


Template.menu.events({
    'click #js-logout': (event, templateInstance) => {
        Meteor.logout()
    }
});

Template.menu.helpers({
    activityNotifications() {
        return ActivityLog.find({owner: Meteor.userId(), type: "message", read: {$ne: true}}).count();
    },
    walletNotifications(){
        return Wallet.find({owner: Meteor.userId(), type: "transaction", read: {$ne: true}}).count();
    }
});

Template.menu.onCreated(function() {
    this.autorun(()=> {
        this.subscribe('wallet');
        this.subscribe('activitylog');
    })
});
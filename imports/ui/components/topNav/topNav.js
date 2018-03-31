import { ActivityLog, Wallet, UserData, Bounties } from '/imports/api/indexDB.js';

import './topNav.html'
import './topNav.scss'
import '../global/globalHelpers'
import swal from 'sweetalert';

Template.topNav.events({
  'click #js-logout': (event, templateInstance) => {
    Meteor.logout()
  },
  'click #js-shareUrl': (event, templateInstance) => {
    event.preventDefault()


swal({
    title: "Share with friends and earn 5% of KZR they earn every day.",
   button: { className: 'btn btn-primary' },
  content: {
    element: "input",
    attributes: {
      id:'shareURL',
      value: "https://blockrazor.org/#H8hpyxk5uoiuiZSbmdfX",
      type: "text",
    },
  }
})

$('#shareURL').select()

  }
});

Template.topNav.helpers({
    shareUrl: () => `${window.location.href}#${(Meteor.users.findOne({_id: Meteor.userId()}) || {}).inviteCode}`,
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

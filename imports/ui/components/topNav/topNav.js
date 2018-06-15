import './topNav.html'
import './topNav.scss'
import '../global/globalHelpers'
import('sweetalert2').then(swal => window.swal = swal.default)
import '/imports/ui/components/global/globalHelpers'
import { colStub } from '/imports/ui/components/compatability/colStub'

Wallet = ActivityLog = UserData = Bounties = colStub

Template.topNav.events({
  'click #js-logout': (event, templateInstance) => {
    Meteor.logout()
  }
});

Template.topNav.helpers({
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
      let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
      if (typeof(balance) === 'string') { return balance }
      return Number( balance.toPrecision(3) )
  	}
});

Template.topNav.onCreated(async function() {
  ({ ActivityLog, UserData, Wallet, Bounties } = (await import('/imports/api/indexDB')));
  colStub.change()

  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  })
});

import './sidebar.html'
import './sidebar.scss'

import { colStub } from '/imports/ui/components/compatability/colStub'
import '/imports/ui/components/global/globalHelpers'

Wallet = ActivityLog = UserData = colStub

Template.sidebar.helpers({
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count()
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: "transaction", read: { $ne: true } }).count()
    },
    balance() {
        return UserData.findOne({}, { fields: { balance: 1 } }).balance
    },
    activeClass: function(route) {
        if (FlowRouter.getRouteName() === route) {
            return 'active';
        }
    }
});

Template.sidebar.events({
      'click .share': (event, templateInstance) => {
      event.preventDefault()
      
      swal({
          title: 'Share with friends and earn 5% of KZR they earn every day.',
          input: 'text',
          confirmButtonText: 'Ok',
          confirmButtonColor : "#000",
          inputValue: "https://blockrazor.org/#H8hpyxk5uoiuiZSbmdfX",
          inputAttributes: {
              id: 'shareURL'
          }

      })
      $('#shareURL').focus()
      $('#shareURL').select()

  },
    'click .sidebar-minimizer': function() {
        // toggle "sidebar-minimized" class to minimize/un-minimize sidebar
        $('body').toggleClass("sidebar-minimized")
    },

    'click .nav-dropdown': function(event) {
        $(event.target).parent().toggleClass("open");

    }
})

Template.sidebar.onCreated(async function() {
    ({ ActivityLog, UserData, Wallet } = (await
        import ('/imports/api/indexDB')));
    colStub.change()

    this.autorun(() => {
        this.subscribe('wallet');
        this.subscribe('activitylog');
    });
});
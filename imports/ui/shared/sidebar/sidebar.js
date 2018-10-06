import './sidebar.html'
import './sidebar.scss'

import { colStub } from '/imports/ui/components/compatability/colStub'
import '/imports/ui/components/global/globalHelpers'

Wallet = ActivityLog = UserData = colStub

Template.sidebar.helpers({
    problemNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), related: "problem", read: { $ne: true } }).count()
    },
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count()
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: { $in: [ "transaction", "welcome" ] }, read: { $ne: true } }).count()
    },
    pendingDevelopers: () => Developers.find({ processed: false }).count(),
    balance() {
        let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
        if (typeof(balance) === 'string') { return balance }
        return Number( balance.toPrecision(3) )
    },
    activeClass: function(route) {
        if (FlowRouter.getRouteName() === route) {
            return 'active';
        }
    }
});

Template.sidebar.events({
      'click .nav-item': function(event) {
        let className = event.currentTarget.className;

          //close the side menu non mobile, but not when the menu item is a parent to a drop down
          if ($(window).width() < 400 && className !='nav-item nav-dropdown') { 
              $('body').removeClass("sidebar-lg-show")
          }
      },
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

    },
    'click .problem-notifications': function(event) {
        event.preventDefault();
        FlowRouter.go('/notifications')
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
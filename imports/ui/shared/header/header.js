import {FlowRouter} from 'meteor/ostrio:flow-router-extra';


import './header.html'

Template.header.onCreated(function() {
        this.searchInputFilter = new ReactiveVar(undefined);
        let searchInputFilter = Template.instance().searchInputFilter.get();

})

Template.header.events({
        'keyup #searchFilterHeader': function (event) {
        event.preventDefault();
        //close the sidebar if you start typing on a mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            $('body').removeClass('sidebar-lg-show')
        }

        let query = $('#searchFilterHeader').val();
        let documentsIndex = $("div.documents-index")

        if (documentsIndex.length === 0) {
            let queryParam = { query: query }
            let path = FlowRouter.path('/', {}, queryParam)
            FlowRouter.go(path)
        }

        //clear filter if no value in search bar
        if (query.length < 1) {
            Blaze.getView($("div.currency-container")[0])._templateInstance.searchInputFilter.set('')

            history.replaceState(null, '', `/`)
        }

        if (query) {
            Blaze.getView($("div.currency-container")[0])._templateInstance.searchInputFilter.set(query)

            history.replaceState(null, '', `?query=${query}`)
        }
    },
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
        let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
        if (typeof(balance) === 'string') { return balance }
        return Number( balance.toPrecision(3) ).toFixed(11).replace(/\.?0+$/, "")
  	}
});
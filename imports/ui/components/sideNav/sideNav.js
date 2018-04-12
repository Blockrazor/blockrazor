import { ActivityLog, Wallet, UserData } from '/imports/api/indexDB.js';

import './sideNav.html'
import './sideNav.scss'
import '../global/globalHelpers'
import Hammer from 'hammerjs'

Template.sideNav.helpers({
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count();
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: "transaction", read: { $ne: true } }).count();
    },
    balance() {
      let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
      return Number( balance.toPrecision(3) )
    }
});

Template.sideNav.onCreated(function() {
  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  });
});

Template.sideNav.events({
  'click .nav-side-menu li a': function (event){
    if (Session.get("screenSize") == 0 && !event.target.parentElement.hasAttribute('data-toggle')){  // if not having submenu items
      Session.set("openedSidebar")
    }
  },
});


Template.sideNav.onRendered(function () {

let swipe = new Hammer(document);
let sideMenuContainer = $('#sidebar');

swipe.on('swiperight swipeleft', function(e) {
  e.preventDefault()
  if (e.type == 'swiperight') {

$( "#navbar-toggler" ).click();
  } else {

$( "#navbar-toggler" ).click();
  }

});

})
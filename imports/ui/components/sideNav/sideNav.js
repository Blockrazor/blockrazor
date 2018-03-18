import { ActivityLog, Wallet } from '/imports/api/indexDB.js';

import './sideNav.html'
import './sideNav.scss'

Template.sideNav.helpers({
  activityNotifications() {
    return ActivityLog.find({owner: Meteor.userId(), type: "message", read: {$ne: true}}).count();
  },
  walletNotifications(){
    return Wallet.find({owner: Meteor.userId(), type: "transaction", read: {$ne: true}}).count();
  },
});

Template.sideNav.onCreated(function() {
  this.autorun(()=> {
    this.subscribe('wallet');
    this.subscribe('activitylog');
  });
});

Template.sideNav.events({
  'click .side-nav-container li a': function (event){
    if (Session.get("screenSize") == 0){
      Session.set("openedSidebar")
    }
  },
  'click #navbar-toggler': function (event) {
    event.preventDefault();
    Session.set("openedSidebar", !Session.get('openedSidebar')) 
    var screen = Session.get("screenSize") 
    //if is mobile then sidebar will just close constantly with no option to keep it open outside actual usage 
    if (screen == 0) { 
      return 
    } 
    var val = Session.get('openedSidebar') 
    var temp = Template.instance() 
    var user = temp.user.get()
    if (!user) { 
      return 
    } 
    var pref = user && user.screenSize? user.screenSize: 3
    if (val == true) { 
      if (screen < pref) { 
        //adjust pref because user wants menu opened at screenSize smaller than current preference 
        Meteor.call("sidebarPreference", screen) 
      } 
    } else { 
      if (screen > pref) { 
        //adjust pref because user wants menu closed at screenSize bigger than current preference 
        Meteor.call("sidebarPreference", 1+screen) 
      } 
    } 
  }
});
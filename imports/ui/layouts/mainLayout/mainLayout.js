import { Template } from 'meteor/templating';
import { UserData } from '/imports/api/indexDB.js';
import './mainLayout.html'
import './mainLayout.scss'

import '../../components/topNav/topNav'
import '../../components/sideNav/sideNav'

Template.mainLayout.events({
  'click #navbar-toggler': function (event) {
    event.preventDefault();
    console.log("toggled")
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
    var pref = Session.get("openedSidebarPreference")
    if (val == true) { 
      if (screen < pref) { 
        //adjust pref because user wants menu opened at screenSize smaller than current preference 
        Session.set('openedSidebarPreference', screen)
      } 
    } else { 
      if (screen > pref) { 
        //adjust pref because user wants menu closed at screenSize bigger than current preference 
        Session.set('openedSidebarPreference', 1+screen)
      } 
    } 
  }
});

Template.mainLayout.helpers({
  openSidebar() {
    return Session.get('openedSidebar') ? "active" : "";
  }
});

Template.mainLayout.onCreated(function () {
  //is used to close sidebar on click outside sidebar
  var handlerForSidebar = function (event) {
    if (!$(event.target).closest('#topnav').length && !$(event.target).closest('#sidebar').length) {
      Session.set("openedSidebar", false)
    }
  }

  function setScreenSize() {
    var width = $(window).width()
    if (width < 577) {
      Session.set("screenSize", 0)
      $(document).bind("click", handlerForSidebar);
    } else if (width < 769) {
      Session.set("screenSize", 1)
      $(document).unbind("click", handlerForSidebar);
    } else if (width < 992) {
      $(document).unbind("click", handlerForSidebar);
      Session.set("screenSize", 2)
    } else if (width < 1201) {
      $(document).unbind("click", handlerForSidebar);
      Session.set("screenSize", 3)
    } else {
      $(document).unbind("click", handlerForSidebar);
      Session.set("screenSize", 4)
    }
  }


  //sets width size by breakpoints, numbers used to make general comparisons (screensize < 3)
  window.addEventListener("resize", _.debounce(setScreenSize, 5));

  //initialize screenSize session var
  setScreenSize()
  this.user = new ReactiveVar(UserData.findOne({_id: Meteor.userId()}))

  //init preferences
  this.autorun(() => {
    let pref = Session.get("openedSidebarPreference")
    var a = Meteor.loggingIn()
    console.log("engaging init", a)
    if (pref == undefined || Meteor.loggingIn()) {
      console.log("running init", Meteor.loggingIn(), "or", pref, pref == undefined || pref == null)
    var user = UserData.findOne({_id: Meteor.userId()})
    Session.set("openedSidebarPreference", user && user.screenSize ? user.screenSize : 3)
    Session.set("openedSidebar", Session.get("openedSidebarPreference") <= Session.get("screenSize"))
    }
  })

  //responsive controller
  this.autorun(() => {
    var user = this.user.get()
    var pref = Session.get("openedSidebarPreference")
    var screen = Session.get("screenSize")
    if (screen >= pref){ 
      Session.set("openedSidebar", true) 
    } else { 
      Session.set("openedSidebar", false) 
    } 
  })

//writes to DB preferences on change and window close/log out
  function saveSidebarPreference(){
    console.log("engaging saveSidebarPreference")
    if (Meteor.userId() && (UserData.findOne({_id: Meteor.userId()}).screenSize? UserData.findOne({_id: Meteor.userId()}).screenSize: 3) != Session.get("openedSidebarPreference")){
      console.log("running saveSidebarPreference")
      Meteor.call("sidebarPreference", Session.get('openedSidebarPreference')) 
      Session.set("openedSidebarPreference", undefined)
    }
  }

Meteor.beforeLogout(saveSidebarPreference)
window.addEventListener('unload', saveSidebarPreference)
})
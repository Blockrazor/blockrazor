import {
  Template
} from 'meteor/templating';
import {
  UserData
} from '/imports/api/indexDB.js';

Template.desktop.events({
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

Template.desktop.helpers({
  openSidebar() {
    return Session.get('openedSidebar') ? "active" : "";
  }
});

Template.desktop.onCreated(function () {
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
  window.addEventListener("resize", _.debounce(setScreenSize, 50));
  //initialize screenSize session var
  setScreenSize()
  this.user = new ReactiveVar(UserData.findOne())
  this.autorun(() => {
    this.user.set(UserData.findOne())
  })
  this.autorun(() => {
    var user = this.user.get()
    if (!user){
      return
    }
    var pref = user && user.screenSize? user.screenSize: 3
    var screen = Session.get("screenSize")
    if (screen >= pref){ 
      Session.set("openedSidebar", true) 
    } else { 
      Session.set("openedSidebar", false) 
    } 
  })

  var user = this.user.get()
  Session.set("openedSidebar", user && user.screenSize ? user.screenSize <= Session.get("screenSize") : 3 <= Session.get("screenSize"))
})




// //is used to save data at the end of the session instead of bombarding server
// var inFormOrLink;
// $('a').live('click', function () {
//   inFormOrLink = true;
// });
// $('form').bind('submit', function () {
//   inFormOrLink = true;
// });

// $(window).bind('beforeunload', function (eventObject) {
//   var returnValue = undefined;
//   if (!inFormOrLink) {
//     Meteor.call("sidebarPreference", $(window).width(), Session.get("screenSize"))
//     returnValue = "Do you really want to close?";
//   }
//   eventObject.returnValue = returnValue;
//   return returnValue;
// });



Template.desktop.onDestroyed(function () {

})
import { Template } from 'meteor/templating';
import { UserData, developmentValidationEnabledFalse } from '/imports/api/indexDB.js';
import './mainLayout.html'
import './mainLayout.scss'

import swal from 'sweetalert';
import Cookies from 'js-cookie';

import '../../components/topNav/topNav'
import '../../components/sideNav/sideNav'

//writes to DB preferences on change and window close/log out
//doesn't run on unload as it should as websocket closes before method reaches server, is an issue in meteor
function saveSidebarPreference(){
  if (Meteor.userId() && (UserData.findOne(Meteor.userId()).screenSize? UserData.findOne(Meteor.userId()).screenSize: 3) != Session.get("openedSidebarPreference")){
    Meteor.call("sidebarPreference", Session.get('openedSidebarPreference'), Meteor.userId())
    Session.set("openedSidebarPreference", undefined) //don't remove this, explanation in init autorun
  }
}

//send preference data to server before closing window for it to decide weather to save it
Meteor.startup(function(){
  $(window).bind('beforeunload', function(){
    closingWindow()
  });
});

function closingWindow(){
  Meteor.call("sidebarPreference", Session.get("openedSidebarPreference"), UserData.findOne(Meteor.userId()).screenSize)
}

Template.mainLayout.events({
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
  },
  "click #hideDevelopmentNotification": (eve, templ)=>{
    return Cookies.set('underDevelopmentShown', true, 5)
  },
  'submit #subscribeForAlphaLaunch': (eve)=>{
    eve.preventDefault()
    Meteor.call("subscribeForAlphaLaunch", $(".js-mailSub").val(), (err,res)=>{
      if (res){
        Cookies.set('underDevelopmentShown', true, 5)
        $('.underDev').modal('hide');
        sAlert.success("Email added to the list of subsribers")
      } else {
        sAlert.error(err)
      }
    })
  }
})

Template.mainLayout.helpers({
  openSidebar() {
    return Session.get('openedSidebar') ? "active" : "";
  },
});

Template.mainLayout.onRendered(function(){
  //used to toggle under development toggle
      if (!developmentValidationEnabledFalse) {
        return 
      } else if (!Cookies.get('underDevelopmentShown')){
        $('.underDev').modal('show');
      }
})

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
  //using meteor.logginIn() is impossible since it's permanently false
  //thus make sure pref is undefined after log out/on init and user is queried before if statement
  this.autorun(() => {
    let pref = Session.get("openedSidebarPreference")
    var user = UserData.findOne({_id: Meteor.userId()})
    if (pref == undefined) {
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

Meteor.beforeLogout(saveSidebarPreference)
})
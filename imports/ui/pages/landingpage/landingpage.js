import './landingpage.html'

Template.landingpage.onRendered(function () {
  // hide the menu when the landing page is open
  $('body').removeClass("sidebar-md-show")
});

Template.landingpage.helpers({
  startUrl(){
    if(Meteor.userId()){
      return '/home'
    } else {
      return '/login'
    }
  }
})
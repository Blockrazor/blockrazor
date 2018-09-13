import './landingpage.html'
import './landingpage.scss'
import '../signup/signup'

Template.landingpage.onRendered(function () {
  // hide the menu when the landing page is open
  $('body').removeClass('sidebar-md-show')
  // hide breadcrumb
  $('.breadcrumb').hide()
})
Template.landingpage.onDestroyed(function () {
  $('.breadcrumb').show()
})

Template.landingpage.helpers({
  startUrl () {
    if (Meteor.userId()) {
      return '/home'
    } else {
      return '/login'
    }
  },
  loggedIn () {
    if (Meteor.user()) {
      return true
    }
    return false
  }
})

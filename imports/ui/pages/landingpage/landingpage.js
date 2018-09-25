import './landingpage.html'
import './landingpage.scss'
import '../signin/signin'

import { Currencies, UsersStats } from '/imports/api/indexDB.js'

Template.landingpage.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('usersStats')
    })
})

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
    startUrl: () => Meteor.userId() ? '/home' : '/login',
    loggedIn: () => !!Meteor.userId(),
    onlineUsers() {
        return ((UsersStats.findOne('connected') || {}).userIds || []).length || 0
    },
    createdUsers() {
        return (UsersStats.findOne('created') || {}).created || 0
    },
    signedUp: () => (UsersStats.findOne({
        _id: 'lastMonth'
    }) || {}).created || 0,
    comments: () => (UsersStats.findOne({
        _id: 'lastMonthComments'
    }) || {}).created || 0,
})


Template.landingpage.onDestroyed(function() {
    //when you leave the landing page, ensure the sidemenu is opened
    $('body').addClass('sidebar-md-show')
})
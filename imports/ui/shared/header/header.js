import {Meteor} from 'meteor/meteor';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import { Encryption } from '/imports/api/indexDB.js'
import './header.html'

import { Cookies } from 'meteor/ostrio:cookies'
const cookies = new Cookies()

Template.header.onCreated(function() {
        this.searchInputFilter = new ReactiveVar(undefined);
        let searchInputFilter = Template.instance().searchInputFilter.get();
        this.defaultLanguage = 'en';
        TAPi18n.setLanguage(cookies.get('language') || 'en');

    this.autorun(() => SubsCache.subscribe('encryption'))
})



Template.header.onRendered( function () {
    let language = window.navigator.userLanguage || window.navigator.language;

    if(language != 'en-US' && !cookies.get('language')){
        $('.languageModal').modal('show');
    }
});


Template.header.events({
        'keyup #searchFilterModal': function (event) {
        event.preventDefault();
        //close the sidebar if you start typing on a mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            $('body').removeClass('sidebar-lg-show')
        }

        let query = $('#searchFilterModal').val();
        let documentsIndex = $("div.documents-index")

        if (documentsIndex.length === 0) {
            let queryParam = { query: query }
            let path = FlowRouter.path('/home', {}, queryParam)
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
        'keyup #searchFilterHeader': function (event) {
        event.preventDefault();
        FlowRouter.go('/home')
        //close the sidebar if you start typing on a mobile
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            $('body').removeClass('sidebar-lg-show')
        }

        let query = $('#searchFilterHeader').val();
        let documentsIndex = $("div.documents-index")

        if (documentsIndex.length === 0) {
            let queryParam = { query: query }
            let path = FlowRouter.path('/home', {}, queryParam)
            console.log(path)
            FlowRouter.go(path)
        }

        //clear filter if no value in search bar
        if (query.length < 1) {
            Blaze.getView($("div.currency-container")[0])._templateInstance.searchInputFilter.set('')

            history.replaceState(null, '', `/home`)
        }

        if (query) {
            Blaze.getView($("div.currency-container")[0])._templateInstance.searchInputFilter.set(query)

            history.replaceState(null, '', `/home/?query=${query}`)
        }
    },
    'click .sidebar-toggler': function(event) {
        event.stopPropagation();
        if ($(window).width() < 768) {
            $('body').toggleClass("sidebar-lg-show")
        } else {
            $('body').toggleClass("sidebar-md-show")
        }
    },
    
    'click .searchMobileIcon': (event, templateInstance) => {
    $('.searchModal').modal('show')
  },
    'click #logout': (event, templateInstance) => {

    Meteor.logout()
    FlowRouter.go('/login')


  },
  'click .js-change-lang': function(event, templateInstance) {
    TAPi18n.setLanguage(this.code)
    
    cookies.set('language', this.code)
    $('.languageModal').modal('hide');
  },
  'click .default-language': function(event, templateInstance) {
    TAPi18n.setLanguage(templateInstance.defaultLanguage)
    
    cookies.set('language', templateInstance.defaultLanguage)
    $('.languageModal').modal('hide');
  },
  'click #headerSignIn': (event, templateInstance) => {
    FlowRouter.go('/login')
  },
})

Template.header.helpers({
    deadmanActive: () => Encryption.findOne({ finished: false }),
    shareUrl: () => `${window.location.href}#${(Meteor.users.findOne({_id: Meteor.userId()}) || {}).inviteCode}`,
    activityNotifications() {
        return ActivityLog.find({ owner: Meteor.userId(), type: "message", read: { $ne: true } }).count()
    },
    walletNotifications() {
        return Wallet.find({ owner: Meteor.userId(), type: "transaction", read: { $ne: true } }).count()
    },
    slug: () => Meteor.user().slug,
    balance() {
        let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
        if (typeof(balance) === 'string') { return balance }
        return Number( balance.toPrecision(3) ).toFixed(11).replace(/\.?0+$/, "")
  	},
    languages: () => {
      return Object.keys(TAPi18n.languages_names).map(key => {
        return {
          code: key,
          name: TAPi18n.languages_names[key][1],
          selected: key === TAPi18n.getLanguage()
        }
      })
    }
});
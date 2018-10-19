import { Template } from 'meteor/templating';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import { Wallet, UserData, Currencies } from '/imports/api/indexDB.js';

import '/imports/ui/components/notLoggedIn.html'
import './wallet.html'
import './wallet.scss'

Template.wallet.onCreated(function bodyOnCreated() {

  var self = this
  self.autorun(function() {
    SubsCache.subscribe('wallet');
    SubsCache.subscribe('users');
    SubsCache.subscribe('approvedcurrencies');
  })
});


Template.wallet.onRendered(function () {
  const instance = Template.instance();

  Meteor.setTimeout(() => {
    instance.$("#js-amount").on("input", function () {
      this.value = this.value.slice(0, this.maxLength);
    });
  }, 0);

});








Template.wallet.helpers({
  newWallet: () => {
    let welcome = Wallet.findOne({owner: Meteor.userId(), read: false, type: "welcome"})
    if (welcome) {
      return true
    }
    return false
  },
  otherBalance: (cur) => {
    let user = UserData.findOne({
      _id: Meteor.userId()
    })
    if (user) {
      let bal = user.others && user.others[cur]
      switch(cur.toUpperCase()){
        case 'USD' :
          bal = bal ? (bal).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') : 0
          break
        case 'ETH' :
          bal = bal ? (bal).toFixed(18).replace(/\d(?=(\d{3})+\.)/g, '$&,') : 0
          break
        case 'XMR' :
          bal = bal ? (bal).toFixed(12).replace(/\d(?=(\d{3})+\.)/g, '$&,') : 0
          break  
      }
      return bal;
    }
  },
  balance () {
    let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
    if (typeof(balance) === 'string') { return balance }
    return Number( balance.toPrecision(3) ).toFixed(11).replace(/\.?0+$/, "")
  },
  currencyNotifications: (currency) => {
    var query = {};
    if (currency) {
      switch(currency.toUpperCase()) {
        case 'KZR' :
          query = {owner: Meteor.userId(), read: false, type: "transaction",  $or: [ {message:/KZR/i}, {message:/ZRQ/i} ]}
          break
        case 'USD' :
          query = {owner: Meteor.userId(), read: false, type: "transaction", message:/USD/i}
          break
        case 'ETH' :
          query = {owner: Meteor.userId(), read: false, type: "transaction", message:/ETH/i}
          break
        case 'XMR' :
          query = {owner: Meteor.userId(), read: false, type: "transaction", message:/XMR/i}
          break
      }
    }
	  return Wallet.find(query).count();
  },
  currencyLogo: (currency) => {
  //Not all currencies have a logo so check if the currencyLogoFilename exists otherwise return a placeholder
  let currencyLogoFilename = Currencies.findOne({
      currencyLogoFilename: {$exists:true},
      slug: currency
  });

  return currencyLogoFilename ? _coinUpoadDirectoryPublic + currencyLogoFilename.currencyLogoFilename : '/images/noimage.png'
  }
  });

Template.wallet.events({
  'error img': function(e) {
    // fires when a particular image doesn't exist in given path
    if ($(e.target).attr('src') !== '/codebase_images/noimage.png') {
      $(e.target).attr('src', '/codebase_images/noimage.png')
    }
  },
  'click #js-add': (event, templateInstance) => {
    event.preventDefault()
    if ($('#js-amount').val() && (parseFloat($('#js-amount').val()) > 0)) {
      Meteor.call('addOthers', $('#js-cur').val(), parseFloat($('#js-amount').val()), (err, data) => {
        if (err) {
          sAlert.error(TAPi18n.__(err.reason))
        } else {
          sAlert.success(TAPi18n.__('kzrWallet.deposited'))
        }
      })
    } else {
      sAlert.error(TAPi18n.__('kzrWallet.invalid_amount'))
    }

  },
  'click .currency-card .card-content': function(event) {
    FlowRouter.go('/wallet/'+event.currentTarget.getAttribute('data-value'))
  },
  'click #js-welcome-msg': function (event) {
    event.preventDefault()
    Meteor.call('hideWelcomeMsg', Meteor.userId(), (error, result) => {
      if (error) {
        console.error(error)
      }
    })
  }
})

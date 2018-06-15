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

Template.wallet.helpers({
  otherBalance: (cur) => {
    let user = UserData.findOne({
      _id: Meteor.userId()
    })

    if (user) {
      return user.others && user.others[cur] ? user.others[cur] : 0
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
    $(e.target).attr('src','/images/noimage.png');
  },
  'click #js-add': (event, templateInstance) => {
    event.preventDefault()
    if ($('#js-amount').val() && (parseFloat($('#js-amount').val()) > 0)) {
      Meteor.call('addOthers', $('#js-cur').val(), parseFloat($('#js-amount').val()), (err, data) => {
        if (err) {
          sAlert.error(err.reason)
        } else {
          sAlert.success('Successfully deposited.')
        }
      })
    } else {
      sAlert.error('Please enter a valid amount.')
    }

  },
  'click .currency-card .card-content': function(event) {
    FlowRouter.go('/wallet/'+event.currentTarget.getAttribute('data-value'))
  }
});

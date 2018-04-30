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
    return UserData.findOne({}, {fields: {balance: 1}}).balance
  },
  currencyNotifications: (currency) => {
	  return Wallet.find({
		  owner: Meteor.userId(),
		  type: "transaction",
		  currency: currency,
		  read: false
	  }).count();
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

    Meteor.call('addOthers', $('#js-cur').val(), parseFloat($('#js-amount').val()), (err, data) => {
      if (err) {
        sAlert.error(err.reason)
      } else {
        sAlert.success('Successfully deposited.')
      }
    })
  },
  'click .currency-card .card-content': function(event) {
    FlowRouter.go('/wallet/'+event.currentTarget.getAttribute('data-value'))
  }
});

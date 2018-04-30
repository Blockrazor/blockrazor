import { Template } from 'meteor/templating';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import { Wallet, UserData } from '/imports/api/indexDB.js';

import '/imports/ui/components/notLoggedIn.html'
import './walletTransactions.html'
import './wallet.scss'

Template.walletTransactions.onCreated(function bodyOnCreated() {
	var currency = FlowRouter.getParam('currency');

    this.rewardType = new ReactiveVar()
    this.currencyType = FlowRouter.current().params.currency

    var self = this
    self.autorun(function() {
      SubsCache.subscribe('wallet');
      SubsCache.subscribe('users');
    })

	// mark notifications for selected currency as read
	Meteor.call('markAsRead', currency, (error, result) => {
		if (error) {
			console.error(error)
		}
	});
});

Template.walletTransactions.helpers({
  canDeposit: () => ~['xmr'].indexOf(FlowRouter.getParam('currency')),
  hasPaymentId: () => ~['xmr'].indexOf(FlowRouter.getParam('currency')),
  depositAddress: () => global[`_${FlowRouter.getParam('currency').toUpperCase()}Address`],
  paymentId: () => {
    let user = UserData.findOne({
      _id: Meteor.userId()
    })

    return user.paymentId
  },
  entry (){
    var filter = Template.instance().rewardType.get();
    var currencyType = Template.instance().currencyType;
    var query = filter ? {type: "transaction", rewardType:filter} : {type: "transaction"}

    if (currencyType) {
      switch(currencyType.toUpperCase()) {
        case 'KZR' :
          query = filter ? {type: "transaction", rewardType:filter,  $or: [ {message:/KZR/i}, {message:/ZRQ/i}, {message:/ZZR/i} ]} : {type: "transaction",  $or: [ {message:/KZR/i}, {message:/ZRQ/i} ]}
          break
        case 'USD' :
          query = filter ? {type: "transaction", rewardType:filter, message:/USD/i} : {type: "transaction", message:/USD/i}
          break
        case 'ETH' :
          query = filter ? {type: "transaction", rewardType:filter, message:/ETH/i} : {type: "transaction", message:/ETH/i}
          break
        case 'XMR' :
          query = filter ? {type: "transaction", rewardType:filter, message:/XMR/i} : {type: "transaction", message:/XMR/i}
          break
      }
    }
    return Wallet.find(query, {sort: {time: -1 }});
  },
  walletTable: function () {
    return {
      noDataTmpl: 'noDataTmpl',
      rowsPerPage: 100,
      showFilter: false,
      fields: [
        {
          key: 'message',
          label: 'Message',
          fn: function(value, object, key) {
            // convert old 'ZZR' and 'ZRQ' labels to 'KZR' and return
            return value.replace("ZZR", "KZR").replace("ZRQ", "KZR");
          }
        },
                        {
          key: 'amount',
          label: 'Amount'
        },
        {
          key: 'time',
          label: 'Date / Time',
          sortByValue:true,
          sortOrder: 0,
          sortDirection: -1,
          fn: function(value, object, key) { return new Date(value).toLocaleString([], {day:'numeric',month:'short',year:'numeric',hour: '2-digit', minute:'2-digit'}) }
        },
        {
          key: 'from',
          label: 'From',
          fn: function(value, object, key) { return (Meteor.users.findOne(value) || {}).username || value; }
        },
        {
          key: 'rewardType',
          label: 'Type',
          fn: function(value, object, key) { return transactionTypes(value); }
        },
      ]
    };
  },
  currencyType : () => {
    return Template.instance().currencyType.toUpperCase()
  }
})

Template.walletTransactions.events({
  'change .rewardTypeFilter': function(event) {
      Template.instance().rewardType.set(event.target.value)
  },
  'click .clearFilter': function(event) {
    Template.instance().rewardType.set(false);

    $(".rewardTypeFilter option").filter(function() {
        return $(this).text() == "--Select transaction type--";
    }).prop('selected', true);
  }
})

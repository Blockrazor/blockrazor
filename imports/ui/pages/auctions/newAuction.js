import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './newAuction.template.html'

import { initDatePicker } from '../addCoin/addCoin'

Template.newAuction.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('publicUserData')
	})

  this.baseCurrency = new ReactiveVar('KZR')
  this.auctionPeriods = [{
  	'hours':1,'label':TAPi18n.__('auctions.new.one_hour')
  }, {
  	'hours':3,'label':TAPi18n.__('auctions.new.three_hours')
  }, {
  	'hours':6,'label':TAPi18n.__('auctions.new.six_hours')
  }, {
  	'hours':24,'label': TAPi18n.__('auctions.new.one_day')
  }, {
  	'hours':72,'label':TAPi18n.__('auctions.new.three_days')
  }, {
  	'hours':120,'label':TAPi18n.__('auctions.new.five_days')
  }, {
  	'hours':240,'label':TAPi18n.__('auctions.new.ten_days')
  } ]
})

Template.newAuction.helpers({
	balance: () => {
		let user = UserData.findOne({
			_id: Meteor.userId()
		})

		return (Template.instance().baseCurrency.get() === 'KZR' ? user.balance : (user.others || {})[Template.instance().baseCurrency.get()] || 0)
	},
	accepted: () => Template.instance().baseCurrency.get() === 'KZR' ? ['USD', 'ETH', 'XMR'] : ['KZR'],
  fixed: (val) => val.toFixed(6),
  endsOn: () => {
    return Template.instance().auctionPeriods
  }
})

Template.newAuction.events({
	'change #js-bcur': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.baseCurrency.set($(event.currentTarget).val())
	},
	'submit #js-form': (event, templateInstance) => {
		 event.preventDefault()

	    $("#js-form").addClass('was-validated');

	    if(!$('#js-reserve').val()){
	    	$('#js-reserve').val('0')
	    }

	    //if the form is invalid do not submit and display errors to user
	    if ($("#js-form")[0].checkValidity()) {
	        //form looks good, call method
	        Meteor.call('newAuction', $('#js-name').val(), '', {
	            amount: parseFloat($('#js-amount').val()),
	            baseCurrency: $('#js-bcur').val(),
	            acceptedCurrency: $('#js-acur').val(),
	            timeout: new Date().getTime() + $('#js-end').val() * 60 * 60 * 1000, // add selected period to current timestamp
	            reserve: parseFloat($('#js-reserve').val()),
	            reserveMet: parseFloat($('#js-reserve').val()) === 0
	        }, (err, data) => {
	            if (err) {
	                sAlert.error(TAPi18n.__(err.reason))
	            } else {
	            	
	                FlowRouter.go('/auctions')
	            }
	        })
	    }

	},
	'click #js-cancel': (event, templateInstance) => {
		event.preventDefault()

		FlowRouter.go('/auctions')
	}
})
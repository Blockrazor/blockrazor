import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './newAuction.template.html'

import { initDatePicker } from '../addCoin/addCoin'

Template.newAuction.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('publicUserData')
	})

	this.baseCurrency = new ReactiveVar('KZR')
})

Template.newAuction.onRendered(function() {
	initDatePicker('js-end', 'YYYY-MM-DD HH:mm', 'YYYY MM DD HH mm', 'end-date')
})

Template.newAuction.helpers({
	balance: () => {
		let user = UserData.findOne({
			_id: Meteor.userId()
		})

		return (Template.instance().baseCurrency.get() === 'KZR' ? user.balance : (user.others || {})[Template.instance().baseCurrency.get()] || 0)
	},
	accepted: () => Template.instance().baseCurrency.get() === 'KZR' ? ['USD', 'ETH', 'XMR'] : ['KZR'],
	fixed: (val) => val.toFixed(6)
})

Template.newAuction.events({
	'change #js-bcur': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.baseCurrency.set($(event.currentTarget).val())
	},
	'submit #js-form': (event, templateInstance) => {
		event.preventDefault()

		if (parseFloat($('#js-amount').val()) > 0 && $('#js-name').val() && $('#js-end').val() && $('#js-reserve').val()) {
			Meteor.call('newAuction', $('#js-name').val(), '', {
				amount: parseFloat($('#js-amount').val()),
				baseCurrency: $('#js-bcur').val(),
				acceptedCurrency: $('#js-acur').val(),
				timeout: new Date($('#js-end').val()).getTime(),
				reserve: parseFloat($('#js-reserve').val()),
				reserveMet: parseFloat($('#js-reserve').val()) === 0
			}, (err, data) => {
				if (err) {
					sAlert.error(err.reason)
				} else {
					sAlert.success('Auction created.')

					FlowRouter.go('/auctions')
				}
			})
		} else {
			sAlert.error('Some fields are missing.')
		}
	},
	'click #js-cancel': (event, templateInstance) => {
		event.preventDefault()

		FlowRouter.go('/auctions')
	}
})
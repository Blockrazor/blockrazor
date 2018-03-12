import { Template } from 'meteor/templating'
import { Currencies, Auctions, Bids, UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './currencyAuction.template.html'

Template.currencyAuction.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('auction', 'top-currency')
		SubsCache.subscribe('bids', 'top-currency')
		SubsCache.subscribe('publicUserData')
	})

	this.search = new ReactiveVar('')
})

Template.currencyAuction.helpers({
	allCurrencies: () => Currencies.find({
		$or: [{
			currencyName: new RegExp(Template.instance().search.get(), 'gi')
		}, {
			currencySymbol: new RegExp(Template.instance().search.get(), 'gi')
		}]
	}),
	currencies: () => {
		let bids = Bids.find({
			auctionId: 'top-currency',
			'options.type': 'currency'
		}).fetch()

		let currencies = {}

		bids.forEach(i => {
			currencies[i.options.currency] = currencies[i.options.currency] ? currencies[i.options.currency] + i.amount : i.amount
		})

		let sorted = Object.keys(currencies).sort((i1, i2) => {
			return currencies[i2] - currencies[i1]
		})

		return sorted.map(i => ({
			options: {
				currency: i
			},
			amount: currencies[i]
		})).slice(0, 3) // return the top 3
	},
	auction: () => Auctions.findOne({
		_id: 'top-currency'
	}),
	myBids: () => Bids.find({
		auctionId: 'top-currency',
		userId: Meteor.userId()
	}, {
		sort: {
			date: -1
		}
	}),
	bids: () => Bids.find({
		auctionId: 'top-currency'
	}, {
		sort: {
			date: -1
		}
	}).fetch().slice(0, 10),
	balance: () => (UserData.findOne({
		_id: Meteor.userId()
	}) || {}).balance,
	currency: function() {
		return (Currencies.findOne({
			_id: (this.options || {}).currency
		}) || {}).currencyName || ''
	},
	fixed: (val) => val.toFixed(2)
})

Template.currencyAuction.events({
	'click .js-cancel': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('cancelBid', this._id, (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} else {
				sAlert.success('Bid cancelled.')
			}
		})
	},
	'submit #js-form': (event, templateInstance) => {
		event.preventDefault()

		if (parseFloat($('#js-amount').val()) > 0 && $('#js-currency').val()) {
			Meteor.call('placeBid', 'top-currency', parseFloat($('#js-amount').val()), {
				type: 'currency',
				currency: $('#js-currency').val()
			}, (err, data) => {
				if (err) {
					sAlert.error(err.reason)
				} else {
					sAlert.success('Bid successfully placed.')
				}
			})
		} else {
			sAlert.error('Some fields are missing.')
		}
	},
	'keyup #js-cur': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.search.set($(event.currentTarget).val())
	}
})
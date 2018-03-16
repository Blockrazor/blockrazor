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
	this.now = new ReactiveVar(Date.now())
	this.current = new Date()
	this.current.setSeconds(0)
	this.current = this.current.getTime() // count from the last full minute, as that's when the auction was last drained

	Meteor.setInterval(() => this.now.set(Date.now()), 250) // update the timer every 250ms for smooth drainage
})

Template.currencyAuction.helpers({
	allCurrencies: () => Currencies.find({
		$or: [{
			currencyName: new RegExp(Template.instance().search.get(), 'gi')
		}, {
			currencySymbol: new RegExp(Template.instance().search.get(), 'gi')
		}, {
			'previousNames.tag': new RegExp(Template.instance().search.get(), 'gi')
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
	fixed: (val) => val.toFixed(6),
	amountBid: function() {
		let featured = Currencies.findOne({
			_id: this.options.currency
		}).featured

		if (featured) { // an easy way to check if the currency is currently on top without recalculating
			// drain the amount slowly
			let allBids = Bids.find({
				auctionId: 'top-currency',
				'options.currency': this.options.currency
			}).count()

			return (this.amount - (((Template.instance().now.get() - Template.instance().current) / 1000) * (0.01 / allBids / 240))).toFixed(6) // 0.01 divided by 240 (60*4) by the total number of bids
		}

		return this.amount.toFixed(6)
	},
	amountCurrency: function() {
		let featured = Currencies.findOne({
			_id: this.options.currency
		}).featured

		if (featured) { // only drain the top currency
			return (this.amount - (((Template.instance().now.get() - Template.instance().current) / 1000) * (0.01 / 240))).toFixed(6)
		}

		return this.amount.toFixed(6) // otherwise just return the amount
	}
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
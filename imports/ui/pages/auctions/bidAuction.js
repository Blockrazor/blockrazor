import { Template } from 'meteor/templating'
import { Auctions, Bids, UserData, Currencies } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './bidAuction.template.html'

Template.bidAuction.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('users')
		SubsCache.subscribe('auction', FlowRouter.getParam('id'))
		SubsCache.subscribe('bids', FlowRouter.getParam('id'))
		SubsCache.subscribe('publicUserData')
		SubsCache.subscribe('approvedcurrencies')
	})
})

Template.bidAuction.helpers({
  author: function() {
    return this.createdBy === Meteor.userId() && !this.closed
  },
	highest: function() {
		return this.options.highest || 0
	},
	needsUSD: function(curr) {
		return ~['ETH', 'XMR'].indexOf(curr)
	},
	USDprice: function(curr, amount) {
		let currency = Currencies.findOne({
			currencySymbol: curr
		})

		if (currency && currency.price) {
			return (amount * currency.price).toFixed(2)
		}

		return 0
	},
	pricePerKZR: function() {
		if (this.options.baseCurrency === 'KZR') {
			return ((this.options.highest || 0) / this.options.amount).toFixed(5)
		} else {
			return (this.options.highest || 0) !== 0 ? (this.options.amount / (this.options.highest || 0)).toFixed(5) : '0.00000'
		}
	},
	currency: function() {
		return this.options.baseCurrency === 'KZR' ? this.options.acceptedCurrency : this.options.baseCurrency
	},
	auction: () => Auctions.findOne({
		_id: FlowRouter.getParam('id')
	}),
	bids: () => Bids.find({
		auctionId: FlowRouter.getParam('id')
	}, {
		sort: {
			date: -1
		}
	}).fetch().slice(0, 10),
	balance: () => {
		let user = UserData.findOne({
			_id: Meteor.userId()
		}) || {}

		let auction = Auctions.findOne({
			_id: FlowRouter.getParam('id')
		}) || {}

		return (auction.options.acceptedCurrency === 'KZR' ? user.balance : (user.others || {})[auction.options.acceptedCurrency] || 0)
	},
	fixed: (val) => val.toFixed(6),
	user: function() {
		return (Meteor.users.findOne({
			_id: this.userId
		}) || {}).username
	},
	winner: function() {
		let bid = Bids.findOne({
			auctionId: this._id,
			amount: this.options.highest
		})

		return bid && (Meteor.users.findOne({
			_id: bid.userId
		}) || {}).username || 'No winner'
	},
	remTime: function() {
		return moment(this.options.timeout).fromNow()
	}
})

Template.bidAuction.events({
	'submit #js-form': (event, templateInstance) => {
		event.preventDefault()

		let auction = Auctions.findOne({
			_id: FlowRouter.getParam('id')
		}) || {}

		if (parseFloat($('#js-amount').val()) > 0) {
			Meteor.call('placeBid', FlowRouter.getParam('id'), parseFloat($('#js-amount').val()), {
				currency: auction.options.acceptedCurrency
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
  'click .js-cancel': function(event, templateInstance) {
    event.preventDefault()

    Meteor.call('cancelAuction', this._id, (err, data) => {
        if (!err) {
            sAlert.success('Successfully cancelled.')
            FlowRouter.go('/auctions')
        } else {
            sAlert.error(err.reason)
        }
    })
},
})
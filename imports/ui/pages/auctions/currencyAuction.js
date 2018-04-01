import { Template } from 'meteor/templating'
import { Currencies, Auctions, Bids, UserData, LocalCurrencies } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './currencyAuction.template.html'

import typeahead from 'corejs-typeahead'

Template.currencyAuction.onRendered(function () {

		this.autorun((comp) => {
		if (this.methodReady.get()) {
			this.init()
			comp.stop()
		}
	})
	this.init()

});

Template.currencyAuction.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('auction', 'top-currency')
		SubsCache.subscribe('bids', 'top-currency')
		SubsCache.subscribe('publicUserData')
	})

	this.search = new ReactiveVar('')
	this.methodReady = new ReactiveVar(false)
	this.now = new ReactiveVar(Date.now())
	this.current = new Date()
	this.current.setSeconds(0)
	this.current = this.current.getTime() // count from the last full minute, as that's when the auction was last drained

	Meteor.setInterval(() => this.now.set(Date.now()), 250) // update the timer every 250ms for smooth drainage

this.init = function () {
		var option1 = {
			hint: true,
			highlight: true,
			minLength: 0,
		}
		var option2 = {
			name: 'states',
			display: (x) => x.currencyName,
			limit: 15,
			source: currySearch(Template.instance())
		}
	
		//binding for updating autocomplete source on deletion of items
		this.option1 = option1
		this.option2 = option2

		function currySearch(template) {
			return function typeAheadSearch(entry, CB) {
				CB(
					template.TransitoryCollection.find({
						$or: [{
							currencyName: new RegExp(entry, 'ig')
						}, {
							currencySymbol: new RegExp(entry, 'ig')
						}],
					}, {
						limit: 15,
						sort: {
							currencyName: 1
						}
					}).fetch()
				)
			}
		}

	//adds first found entry in autocomplete on enter keypress
		$('.typeahead').typeahead(option1, option2).on('keyup', {
			templ: Template.instance()
		}, function (event) {
			if (event.keyCode == 13) {
				var a = event.data.templ.TransitoryCollection.findOne({
					$or: [{
						currencyName: new RegExp(event.target.value, 'ig')
					}, {
						currencySymbol: new RegExp(event.target.value, 'ig')
					}],
					currencySymbol: {
						$nin: event.data.templ.compared.get()
					}
				}, {
					sort: {
						currencyName: 1
					}
				})
			}

		}).on('typeahead:selected', function(event, data){    
		console.log(data)        
        $('#js-currency').val(data._id);        
    });

	}

		//logic for receiving benefits of fast-render and yet using nonreactive data from method
	if (!LocalCurrencies.find().count()) {
		this.TransitoryCollection = Currencies
		// this.transitioning = new ReactiveVar(true)
		Meteor.call('fetchCurrencies', (err, res) => {
			res.forEach(x => {
				LocalCurrencies.insert(x)
			})
			this.TransitoryCollection = LocalCurrencies
			$('.typeahead').typeahead('destroy')
			this.methodReady.set(true)
		})
	} else {
		this.TransitoryCollection = LocalCurrencies
		// this.transitioning = new ReactiveVar(false)
	}

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
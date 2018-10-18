import { Template } from 'meteor/templating'
import { Currencies, Auctions, Bids, UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './currencyAuction.template.html'

import '/imports/ui/components/typeahead'

Template.currencyAuction.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('auction', 'top-currency')
		SubsCache.subscribe('bids', 'top-currency')
		SubsCache.subscribe('publicUserData')
	})

	this.selectedId = new ReactiveVar()
	this.now = new ReactiveVar(Date.now())
	this.current = new Date()
	this.current.setSeconds(0)
	this.current = this.current.getTime() // count from the last full minute, as that's when the auction was last drained

	Meteor.setInterval(() => this.now.set(Date.now()), 250) // update the timer every 250ms for smooth drainage
})



Template.currencyAuction.onRendered(function(){
	const instance=Template.instance();
     Meteor.setTimeout(()=>{
		instance.$("#js-amount").on("input",function(){
			this.value=this.value.slice(0,this.maxLength);
		});
	},10)
})

Template.currencyAuction.helpers({
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
		return (Currencies.findOneLocal({
			_id: (this.options || {}).currency
		}) || {}).currencyName || ''
	},
	fixed: (val) => val.toFixed(6),
	amountBid: function() {
		let featured = Currencies.findOne({ // this needs to be reactive
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
	},
	typeaheadProps: function() {
		return {
			limit: 15,
			query: function(templ, entry){
				return {
					$or: [{
						currencyName: new RegExp(entry, 'ig')
					}, {
						currencySymbol: new RegExp(entry, 'ig')
					}],
				}
			},
			projection: function(templ, entry){
				return {
					limit: 15,
					sort: {
						currencyName: 1
					}
				}
			},
			add: function(event, doc, templ){templ.selectedId.set(doc._id)},
			col: Currencies, //collection to use
			template: Template.instance(), //parent template instance
			focus: false,
			autoFocus: false,
			quickEnter: false,
			displayField: "currencyName", //field that appears in typeahead select menu
			placeholder: TAPi18n.__('auctions.currency.search')
		}
	}
})

Template.currencyAuction.events({
	'click .js-cancel': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('cancelCurrencyBid', this._id, (err, data) => {
			if (err) {
				sAlert.error(TAPi18n.__(err.reason))
			} else {
				sAlert.success(TAPi18n.__('auctions.currency.cancelled'))
			}
		})
	},
	'submit #js-form': (event, templateInstance) => {
     	event.preventDefault()
    
    	// let currencyId = templateInstance.selectedId.get()

	    // if currency symbol value is 'ZKR', replace that with 'KZR'
	    // this replacement line no longer necessary after updating the currncy symbol of Krazor in the database 
	    // currencySymbol = currencySymbol === 'ZKR' ? 'KZR' : currencySymbol  // TODO: remove this replacement line after updating the database

		if (parseFloat($('#js-amount').val()) > 0 && templateInstance.selectedId.get() != "") {
			Meteor.call('placeBid', 'top-currency', parseFloat($('#js-amount').val()), {
				type: 'currency',
				currency: templateInstance.selectedId.get()
			}, (err, data) => {
				if (err) {
					if (err.reason.toLowerCase().includes('currency')) {
						$('#currencyError').text(TAPi18n.__(err.reason))
						$('#currencyError').show()
					} else {
						$('#amountError').text(TAPi18n.__(err.reason))
						$('#amountError').show()
					}
				} else {
					['amount', 'currency'].forEach(i => $(`#${i}Error`).hide())

					sAlert.success(TAPi18n.__('auctions.currency.bid_placed'))
				}
			})
		} else {
			$('#amountError').toggle(isNaN(parseFloat($('#js-amount').val())) || parseFloat($('#js-amount').val()) <= 0) 
			$('#currencyError').toggle(!templateInstance.selectedId.get())

			$('#amountError').text(TAPi18n.__('auctions.currency.amount_invalid'))
			$('#currencyError').text(TAPi18n.__('auctions.currency.currency_invalid'))
		}
	},
})
import { Template } from 'meteor/templating'
import { Wallet } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './transactions.html'

const perPage = 10

Template.transactions.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('users')
	})

	this.transactionsCount = new ReactiveVar(1)
	this.transactions = new ReactiveVar([])
	this.total = new ReactiveVar(0)
	this.rewardType = new ReactiveVar()



	// we can't use Meteor subscribe for data, because another global wallet (transactions) subscription in the navBar is messing with the transaction data that should be displayed here (the curse of meteor reactivity)
	// another possiblity would be to subscribe to all transactions at once and filter them on the client side, but that wouldn't be quite optimal for a lot of transactions (even on localhost, it takes a bit of time to subscribe to 400+ transactions)

	this.autorun(() => {
		Meteor.call('transactions', FlowRouter.getParam('page') || '1', Template.instance().rewardType.get(),  (err, data) => {
			this.transactions.set(data)
		})
		Meteor.call('transactionCount',Template.instance().rewardType.get(), (err, data) => { // get the total nubmer of transactions for pagination
			this.transactionsCount.set(data)
		})

		Meteor.call('totalAmount', (err, data) => { // get the total nubmer of transactions for pagination
		    if (err) {
		        console.log(err)
		    } else {
		        this.total.set(data)
		    }
		})
	})
})

Template.transactions.helpers({
	activePage(page) {
		if (page === parseInt(FlowRouter.getParam('page'))) return 'active'
	},
	currency: function() {
		return this.currency || 'KZR'
	},
	transactions: () => Template.instance().transactions.get(),
	from: function() {
		return (this.from === 'System' || this.from === 'Blockrazor') ? TAPi18n.__('transactions.master') : (Meteor.users.findOne({
			_id: this.from
		}) || {}).username || ''
	},
	to: function() {
		return (Meteor.users.findOne({
			_id: this.owner
		}) || {}).username || ''
	},
	amount: function() {
		let amount = this.amount;
		return amount;
	},
	color: function() {
		return this.amount > 0 ? 'green' : 'red'
	},
	total: () => Template.instance().total.get(),
	pages: () => {
		// return [...Array(Math.ceil(Template.instance().transactions.get() / perPage)).keys()].map(i => ++i) // returning all indexes wouldn't be nice
		let max = Math.ceil(Template.instance().transactionsCount.get() / perPage) + ''
		let page = FlowRouter.getParam('page') || '1'

		let length = parseInt(max) >= 3 ? 3 : parseInt(max)

		if (page === '1') {
			return [...Array(length).keys()].map(i => ++i) // pages need to be 1-indexed, 1, 2, max
		} else if (page === max) {
			return [...Array(length).keys()].map(i => parseInt(max) - i).reverse() // max - 2, max - 1, max
		} else {
			return [...Array(length).keys()].map(i => parseInt(page) - 2 + ++i) // page - 1, page, page + 1
		}
	},
	prevPage: () => {
		let page = FlowRouter.getParam('page') || '1'

		return page === '1' ? '1' : page - 1 // 1 is min
	},
	nextPage: () => {
		let max = Math.ceil(Template.instance().transactionsCount.get() / perPage) + '' // make it a string
		let page = FlowRouter.getParam('page') || '1'

		return page === max ? max : parseInt(page) + 1 // num of pages is max
	},
	lastPage: () => Math.ceil(Template.instance().transactionsCount.get() / perPage),
	pageClass: function() {
		let page = FlowRouter.getParam('page') || '1'
		return (this + '') === page ? 'active' : ''
	}
})

Template.transactions.events({
    'click .form-check-input': function(event, templateInstance) {
			if (templateInstance.$('input:checked').length > 0) {
				if (event.target.value === 'all') {
					Template.instance().rewardType.set(false)
				} else {
					templateInstance.$('input:checked').each(function() {
						if ($(this).val() !== $(event.currentTarget).val()) {
							$(this).prop('checked', false);
						}
					});
					Template.instance().rewardType.set(event.target.value)
				}
			} else {
				Template.instance().rewardType.set(' ')
			}
    }
});

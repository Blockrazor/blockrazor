import { Template } from 'meteor/templating'
import { Auctions, UserData, Currencies } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './allAuctions.template.html'

Template.allAuctions.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('auctions')
        SubsCache.subscribe('publicUserData')
        SubsCache.subscribe('approvedcurrencies')
    })

    this.filter = new ReactiveVar('-')
})

Template.allAuctions.helpers({
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
    auctions: () => {
        let ext = {}
        if (Template.instance().filter.get() === 'CLOSED') {
            ext = {
                closed: true
            }
        } else if (Template.instance().filter.get() === 'OPEN') {
            ext = {
                closed: {
                    $ne: true
                }
            }
        }
        return Auctions.find(_.extend({
            _id: {
                $ne: 'top-currency'
            }
        }, ext), {
            sort: {
                'options.timeout': -1
            }
        })
    },
    fixed: (val) => val.toFixed(6),
    time: function() {
        return moment(this.options.timeout).fromNow()
    },
    status: function() {
        return this.closed ? 'CLOSED' : 'OPEN'
    },
    statusColor: function() {
        return this.closed ? 'red' : 'green'
    },
    verb: function() {
        return this.closed ? 'Ended' : 'Ends'
    }
})

Template.allAuctions.events({
    'click #js-new': (event, templateInstance) => {
        event.preventDefault()

        FlowRouter.go('/new-auction')
    },
    'change #js-filter': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.filter.set($(event.currentTarget).val())
    }
})

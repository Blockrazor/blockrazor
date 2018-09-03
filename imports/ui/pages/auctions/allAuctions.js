import { Template } from 'meteor/templating'
import { Auctions, UserData, Currencies } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { segmentEvent } from '/imports/api/analytics.js'

import './allAuctions.template.html'

Template.allAuctions.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('auctions')
        SubsCache.subscribe('publicUserData')
        SubsCache.subscribe('approvedcurrencies')
    })

    this.open = new ReactiveVar(true)
    this.closed = new ReactiveVar()

        let payload = {
            event: 'Opened all auctions',
        }

        segmentEvent(payload);
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

        var query = {}


        if (Template.instance().open.get() && Template.instance().closed.get()) {
            var query = {

                $or: [{ closed: true }, { closed: { $exists: false } }]
            }
        } else if (Template.instance().open.get()) {
            var query = {
                closed: {$in: [null,false]} //we should be able to remove null on this later on when data is clean
  
            }
        } else if (Template.instance().closed.get()) {
            var query = {
                closed: true
            }
        }

        return Auctions.find(_.extend({
            _id: {
                $ne: 'top-currency'
            }
        }, query), {
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
        return this.closed ? TAPi18n.__('auctions.all.closed') : TAPi18n.__('auctions.all.open')
    },
    statusColor: function() {
        return this.closed ? 'red' : 'green'
    },
    verb: function() {
        return this.closed ? TAPi18n.__('auctions.all.ended') : TAPi18n.__('auctions.all.ends')
    }
})

Template.allAuctions.events({
    'click table tbody tr': (event, templateInstance) => {
        event.preventDefault()

        FlowRouter.go('/auction/'+event.currentTarget.id)
    },
    'click #js-new': (event, templateInstance) => {
        event.preventDefault()

        FlowRouter.go('/new-auction')
    },
    'change .open': (event, templateInstance) => {
        event.preventDefault()
        if ($('.open').is(":checked")) {
            var openValue = true
        } else {
            var openValue = false
        }
        templateInstance.open.set(openValue)
    },
    'change .closed': (event, templateInstance) => {
        event.preventDefault()

        if ($('.closed').is(":checked")) {
            var closedValue = true
        } else {
            var closedValue = false
        }

        templateInstance.closed.set(closedValue)
    }
})
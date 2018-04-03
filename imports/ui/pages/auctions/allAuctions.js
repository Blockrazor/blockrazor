import { Template } from 'meteor/templating'
import { Auctions, UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './allAuctions.template.html'

Template.allAuctions.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('auctions')
        SubsCache.subscribe('publicUserData')
    })

    this.filter = new ReactiveVar('-')
})

Template.allAuctions.helpers({
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
        return moment(this.options.timeout).format(`${_globalDateFormat} HH:mm`)
    },
    author: function() {
        return this.createdBy === Meteor.userId() && !this.closed
    },
    status: function() {
        return this.closed ? 'CLOSED' : 'OPEN'
    },
    statusColor: function() {
        return this.closed ? 'red' : 'green'
    }
})

Template.allAuctions.events({
    'click .js-cancel': function(event, templateInstance) {
        event.preventDefault()

        Meteor.call('cancelAuction', this._id, (err, data) => {
            if (!err) {
                sAlert.success('Successfully cancelled.')
            } else {
                sAlert.error(err.reason)
            }
        })
    },
    'click #js-new': (event, templateInstance) => {
        event.preventDefault()

        FlowRouter.go('/new-auction')
    },
    'change #js-filter': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.filter.set($(event.currentTarget).val())
    }
})

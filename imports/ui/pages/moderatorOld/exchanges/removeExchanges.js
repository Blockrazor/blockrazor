import { Template } from 'meteor/templating'
import { UserData, Exchanges } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './removeExchanges.html'

Template.removeExchanges.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('modExchanges')
	})
})

Template.removeExchanges.helpers({
	exchanges: function() {
		return Exchanges.find({
			removalProposed: true
		})
	},
	currencies: function() {
		return this.currencies.map(i => i.name).toString().replace(/,/ig, ', ')
	},
	voted: function() {
		return !!(this.votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return this.upvotes || 0
	},
	downvotes: function() {
		return this.downvotes || 0
	},
	score: function() {
		return this.score || 0
	}
})

Template.removeExchanges.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('exchangeVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error('Only moderators can vote')
            }

            if (data === 'ok') {
                sAlert.success('Successfully removed.')
            } else if (data === 'not-ok') {
            	sAlert.success('Removal denied.')
            }
        })
    }
})

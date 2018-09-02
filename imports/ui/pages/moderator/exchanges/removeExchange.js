import { Template } from 'meteor/templating'
import { UserData, Exchanges } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './removeExchange.html'

var nextExchange = () => {
    var sample = _.sample(Exchanges.find({
        _id : { $ne : FlowRouter.getParam('id') },
        removalProposed: true,
        votes : { 
            "$not" : { 
                "$elemMatch" : { "userId" : Meteor.userId()  } 
            } 
        }
    }).fetch())

    if (sample === undefined) { 
        FlowRouter.go('/moderator/exchanges') 
    } else {
        FlowRouter.go('/moderator/exchanges/' + sample._id)
    }
}

Template.removeExchange.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('modExchanges')
	})
})

Template.removeExchange.helpers({
	exchanges: function() {
		return Exchanges.find({
			removalProposed: true
		})
    },
    exchange: function() {
        return Exchanges.findOne({ _id : FlowRouter.getParam('id') })
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

Template.removeExchange.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('exchangeVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.exchanges.only_mods'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.exchanges.sucess'))
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.exchanges.denied'))
            }

            nextExchange()
        })
    },
    'click #skipChange': () => {
        nextExchange()
    }
})
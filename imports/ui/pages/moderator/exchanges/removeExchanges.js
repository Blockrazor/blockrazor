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
	exchange () {
        return _.sample(Exchanges.find({
			removalProposed: true,
			votes : { 
				"$not" : { 
					"$elemMatch" : { "userId" : Meteor.userId()  } 
				} 
			}
		}).fetch());
    },
    nextExchange (exchange) {
        if (exchange === undefined) {
            return TAPi18n.__('moderator.exchanges.no_more')    
        } else {
            FlowRouter.go('/moderator/exchanges/' + exchange._id);
        }    
    }
})

Template.removeExchanges.events({
	
})

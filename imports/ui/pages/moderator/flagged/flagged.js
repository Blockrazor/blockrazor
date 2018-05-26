import { Template } from 'meteor/templating'
import { Features, Redflags } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './flagged.html'

Template.flagged.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('features')
		SubsCache.subscribe('redflags')
		SubsCache.subscribe('users')
	})
})

Template.flagged.helpers({
	flagged: () => {
		var collections = { Features, Redflags }
		var objectKeys = _.shuffle(Object.keys(collections))
		var flaggedItems = []

		for (let index = 0; index < objectKeys.length; index++) {
			const element = objectKeys[index];
			flaggedItems = collections[element].find({ 
				flagRatio: { $gt: 0.6 },
				"mod.votes" : { "$not" : { "$elemMatch" : { "userId" : Meteor.userId()  } } }
			}).fetch();

			if (flaggedItems.length > 0) { 
				const sample = _.sample(flaggedItems)
				FlowRouter.go('/moderator/flagged/' + element.toLowerCase() + '/' + sample._id)
				break 
			}
		}

		return flaggedItems
	}
})

Template.flagged.events({

})
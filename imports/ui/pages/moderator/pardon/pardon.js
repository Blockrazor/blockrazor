import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { getName } from '../../suspended/suspended'

import './pardon.html'

Template.pardon.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('pardonUserData')
		SubsCache.subscribe('users')
	})
})

Template.pardon.helpers({
	pardonRequest: () => {
		return _.sample(UserData.find({ 
			'pardon.status' : 'new',
			"pardon.votes" : { "$not" : { "$elemMatch" : { "userId" : Meteor.userId()  } } }
		}).fetch());
	},
	nextPardonRequest: (pardon) => {
		if (pardon === undefined) {
			return
		} 
		FlowRouter.go('/moderator/pardon/' + pardon._id);
	}
})

Template.pardon.events({ })
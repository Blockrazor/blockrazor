import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './suspended.html'

const getName = (type) => {
	const o = {
		'cheating': 'You have been caught lazy answering rating questions',
		'bad-coin': 'You\'ve submitted an invalid cryptocurrency',
		'bad-wallet': 'Your wallet image was invalid',
		'comment': 'Your comment has been flagged and deleted',
		'redflags': 'Your redflag has been flagged and deleted',
		'features': 'Your feature has been flagged and deleted'
	}

	return o[type]
}

export { getName }

Template.suspended.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('myUserData')
	})
})

Template.suspended.helpers({
	isDenied: () => {
		let user = UserData.findOne({
			_id: Meteor.userId()
		})

		return user && user.pardon && user.pardon.status === 'denied'
	},
	didApply: () => {
		let user = UserData.findOne({
			_id: Meteor.userId()
		})

		return user && user.pardon && user.pardon.status === 'new'
	},
	badThings: () => {
		let user = UserData.findOne({
			_id: Meteor.userId()
		})

		return user && user.strikes && user.strikes.map(i => ({
			date: moment(i.time).fromNow(),
			name: getName(i.type)
		}))
	}
})

Template.suspended.events({
	'click #js-apply': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('applyForPardon', $('#js-reason').val(), (err, data) => {})
	}
})
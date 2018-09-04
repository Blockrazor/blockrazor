import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './suspended.html'

const getName = (type) => {
	const o = {
		'cheating': TAPi18n.__('user.suspended.cheating_info'),
		'bad-coin': TAPi18n.__('user.suspended.bad_coin_info'),
		'bad-wallet': TAPi18n.__('user.suspended.bad_wallet_info'),
		'comment': TAPi18n.__('user.suspended.comment_info'),
		'redflags': TAPi18n.__('user.suspended.redflag_info'),
		'features': TAPi18n.__('user.suspended.features_info'),
		'duplicate': TAPi18n.__('user.suspended.features_info')
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

		return user && user.strikes && user.strikes.sort((i1, i2) => i2.time - i1.time).map(i => ({
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
import { Template } from 'meteor/templating'
import { UserData, Encryption } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './deadmanVote.html'

Template.deadmanVote.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('userdata')
		SubsCache.subscribe('users')
	})
})

Template.deadmanVote.helpers({
	deadmanActive: () => Encryption.findOne({ finished: false }),
	canVote: () => {
		let enc = Encryption.findOne({
			finished: false
		}) || {}

		return ~(enc.canVote || []).indexOf(Meteor.userId())
	},
	fixed: (val) => (val || 0).toFixed(2), 
	users: function() {
		let enc = Encryption.findOne({
			finished: false
		}) || {}

		return Meteor.users.find({}).fetch().map(i => {
			return {
				user: i,
				info: (UserData.findOne({
					_id: i._id
				}) || {})
			}
		}).filter(i => {
			return !i.user.suspended
		}).sort((i1, i2) => {
			return (enc.votes || []).reduce((j1, j2) => j1 + (j2.votedFor === i2.user._id ? 1 : 0), 0) - (enc.votes || []).reduce((j1, j2) => j1 + (j2.votedFor === i1.user._id ? 1 : 0), 0) ||
			(((i2.info || {}).balance || 0) - ((i1.info || {}).balance || 0)) ||
			(((i2.info || {}).inputRanking || 0) - ((i1.info || {}).inputRanking || 0))
		})
	},
	voted: function() {
		let enc = Encryption.findOne({
			finished: false
		}) || {}

		return (enc.votes || []).some(i => i.voterId === Meteor.userId()) || this.user._id === Meteor.userId()
	},
	score: function() {
		let enc = Encryption.findOne({
			finished: false
		}) || {}

		return (enc.votes || []).reduce((i1, i2) => i1 + (i2.votedFor === this.user._id ? 1 : 0), 0)
	}
})

Template.deadmanVote.events({
	'click .js-vote': function(event, templateInstance) {
        Meteor.call('deadmanTriggerVote', this.user._id, (err, data) => {
            if (data === 'ok') {
                sAlert.success(TAPi18n.__('deadman.voted'))
            } else if (err) {
            	sAlert.error(TAPi18n.__(err.reason))
            }
        })
    }
})

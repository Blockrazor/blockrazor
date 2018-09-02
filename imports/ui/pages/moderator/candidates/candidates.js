import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './candidates.html'

Template.candidates.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('userData')
		SubsCache.subscribe('users')
	})
})

Template.candidates.helpers({
	fixed: (val) => (val || 0).toFixed(2), 
	users: function() {
		return Meteor.users.find({}).fetch().map(i => {
			return {
				user: i,
				info: (UserData.findOne({
					_id: i._id
				}) || {})
			}
		}).filter(i => {
			let mod = ((i.info || {}).mod || {})

			return mod.candidate && !mod.approved && !mod.denied && !(i.info || {}).moderator && !i.user.suspended
		})
	},
	voted: function() {
		return !!((this.info.mod.votes || {}).votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return (this.info.mod.votes || {}).upvotes || 0
	},
	downvotes: function() {
		return (this.info.mod.votes || {}).downvotes || 0
	},
	score: function() {
		return (this.info.mod.votes || {}).score || 0
	}
})

Template.candidates.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('modCandidateVote', this.user._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.candidates.only_mods_can_vote'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.candidates.success'))
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.candidates.denied'))
            }
        })
    }
})

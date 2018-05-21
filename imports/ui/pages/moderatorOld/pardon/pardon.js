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
	pardons: () => UserData.find({
		'pardon.status': 'new'
	}),
	username: function() {
		return (Meteor.users.findOne({
			_id: this._id
		}) || {}).username
	},
	offences: function() {
		return this.strikes && this.strikes.map(i => ({
			date: moment(i.time).fromNow(),
			name: getName(i.type)
		}))
	},
	voted: function() {
		return !!(this.pardon.votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return this.pardon.upvotes || 0
	},
	downvotes: function() {
		return this.pardon.downvotes || 0
	}
})

Template.pardon.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('pardonVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error('Only moderators can vote')
            }

            if (data === 'ok') {
                sAlert.success('User has been pardoned.')
            } else if (data === 'not-ok') {
            	sAlert.success('Pardon application denied.')
            }
        })
    }
})
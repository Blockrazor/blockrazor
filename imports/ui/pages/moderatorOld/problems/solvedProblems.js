import { Template } from 'meteor/templating';
import { Problems } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import './solvedProblems.html'

Template.solvedProblems.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('solvedProblems')
	})
})

Template.solvedProblems.helpers({
	problems: () => Problems.find({
		solved: true,
		open: true,
		closed: false
	}).fetch(),
	voted: function() {
		return !!(this.votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return this.upvotes || 0
	},
	downvotes: function() {
		return this.downvotes || 0
	},
	status: function() {
		if (this.closed) {
			return 'CLOSED'
		}

		if (this.solved) {
			return 'SOLVED'
		}

		if (this.locked) {
			return 'IN PROGRESS'
		} 

		if (this.open) {
			return 'OPEN'
		}
	},
	statusColor: function(status) {
		return status === 'OPEN' ? 'green' : (status === 'SOLVED' || status === 'IN PROGRESS') ? 'orange' : 'red'
	},
	date: function() {
		return moment(this.date).format(`${_globalDateFormat} HH:MM:SS`)
	},
	user: function() {
		return (Meteor.users.findOne({
			_id: this.createdBy
		}) || {}).username || 'N\\A'
	},
	issue: function() {
		return this.taken.additional.issue
	}
})

Template.solvedProblems.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('problemVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error('Only moderators can vote')
            }

            if (data === 'ok') {
                sAlert.success('Solution accepted.')
            } else if (data === 'not-ok') {
            	sAlert.success('Solution not accepted.')
            }
        })
    }
})
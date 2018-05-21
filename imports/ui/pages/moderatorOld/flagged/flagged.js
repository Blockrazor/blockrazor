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
		let features = Features.find({
			flagRatio: {
				$gt: 0.6 // 60% flags
			}
		}).fetch()

		let redflags = Redflags.find({
			flagRatio: {
				$gt: 0.6
			}
		}).fetch()

		return _.union(features, redflags) // return both
	},
	pardons: () => UserData.find({
		'pardon.status': 'new'
	}),
	username: function() {
		return (Meteor.users.findOne({
			_id: this.createdBy
		}) || {}).username
	},
	text: function() {
		return this.featureName || this.comment || this.name // something has to be defined
	},
	voted: function() {
		return !!((this.mod || {}).votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return (this.mod || {}).upvotes || 0
	},
	downvotes: function() {
		return (this.mod || {}).downvotes || 0
	}
})

Template.flagged.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('flaggedVote', this._id, type, this.comment ? 'comment' : (this.featureName ? 'features' : 'redflags'), (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error('Only moderators can vote')
            }

            if (data === 'ok') {
                sAlert.success('Deleted.')
            } else if (data === 'not-ok') {
            	sAlert.success('Flag removed.')
            }
        })
    }
})
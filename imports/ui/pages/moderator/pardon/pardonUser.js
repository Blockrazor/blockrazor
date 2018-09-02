import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { getName } from '../../suspended/suspended'

import './pardonUser.html'

var newPardonUser = () => {
	var pardonId = FlowRouter.getParam('id');
	var sample = _.sample(UserData.find({ 
		'_id' : { $ne : pardonId },
		'pardon.status' : 'new',
		"pardon.votes" : { "$not" : { "$elemMatch" : { "userId" : Meteor.userId()  } } }
	}).fetch());

	if (sample === undefined) { 
		FlowRouter.go('/moderator/pardon'); 
		return;
	}
	FlowRouter.go('/moderator/pardon/' + sample._id);
}

Template.pardonUser.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('pardonUserData')
		SubsCache.subscribe('users')
	})
})

Template.pardonUser.helpers({
	pardonUser: () => {
		return UserData.findOne({ '_id' : FlowRouter.getParam('id') })
	},
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

Template.pardonUser.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('pardonVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.pardon.only_mod'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.pardon.success'))
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.pardon.denied'))
			}
			newPardonUser();
        })
	},
	'click #skipPardon': function (event) {
		console.log('clicked');
		newPardonUser();
	}
})
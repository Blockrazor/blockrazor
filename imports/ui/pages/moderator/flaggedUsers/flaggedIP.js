import { Template } from 'meteor/templating'
import { UserData, Features, Redflags, Currencies, Wallet, ActivityIPs } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import './flaggedIP.html'

Template.flaggedIP.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('userData')
		SubsCache.subscribe('users')
		SubsCache.subscribe('activityIP', FlowRouter.getParam('ip'))
		SubsCache.subscribe('features')
		SubsCache.subscribe('redflags')
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('walletsMod')
	})
})

Template.flaggedIP.helpers({
	currency: function() {
		return Currencies.findOne({
			_id: this.currencyId
		})
	},
	currencyComment: function() {
		return Currencies.findOne({
			_id: (Features.findOne({
				_id: this.parentId
			}) || {}).currencyId || 
			(Redflags.findOne({
				_id: this.parentId
			}) || {}).currencyId
		})
	},
	currencies: function() {
		return Currencies.find({
			owner: this.user._id
		}, {
			sort: {
				createdAt: -1
			},
			limit: 5
		})
	},
	features: function() {
		return Features.find({
			createdBy: this.user._id,
			featureName: {
				$exists: true
			}
		}, {
			sort: {
				createdAt: -1
			},
			limit: 5
		})
	},
	redflags: function() {
		return Redflags.find({
			createdBy: this.user._id,
			name: {
				$exists: true
			}
		}, {
			sort: {
				createdAt: -1
			},
			limit: 5
		})
	},
	comments: function() {
		return _.union(Features.find({
			createdBy: this.user._id,
			comment: {
				$exists: true
			}
		}, {
			sort: {
				createdAt: -1
			},
			limit: 5
		}).fetch(), Redflags.find({
			createdBy: this.user._id,
			comment: {
				$exists: true
			}
		}, {
			sort: {
				createdAt: -1
			},
			limit: 5
		}).fetch()).sort((i1, i2) => i2.createdAt - i1.createdAt).slice(0, 5)
	},
	totalEarnings: function() {
		return Wallet.find({
			owner: this.user._id
		}).fetch().reduce((i1, i2) => i1 + Number(i2.amount), 0).toFixed(2)
	},
	ip: () => FlowRouter.getParam('ip'),
	users: function() {
		return Meteor.users.find({
			$or: [{
				suspended: false
			}, {
				suspended: {
					$exists: false
				}
			}] // don't include banned users
		}).fetch().map(i => {
			return {
				user: i,
				info: (UserData.findOne({
					_id: i._id
				}) || {})
			}
		}).filter(i => {
			return i.info.sessionData && i.info.sessionData.some(j => j.loggedIP === FlowRouter.getParam('ip')) // IP was used by the user
		}).sort((i1, i2) => {
			return i2.info.sessionData[i2.info.sessionData.length - 1].time - i1.info.sessionData[i1.info.sessionData.length - 1].time
		})
	},
	username: function() {
		return this.user.username === this.user.email ? this.user.username : `${this.user.username} ${this.user.email ? `(${this.user.email})` : ''}`
	},
	lastAccess: function() {
		return moment(this.info.sessionData[this.info.sessionData.length - 1].time).fromNow()
	},
	voted: function() {
		return !!(this.votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return this.upvotes || 0
	},
	downvotes: function() {
		return this.downvotes || 0
	},
	votes: () => ActivityIPs.findOne({
		ip: FlowRouter.getParam('ip')
	}) || {}
})

Template.flaggedIP.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('activityIPVote', FlowRouter.getParam('ip'), type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.flaggedUsers.only_mods'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.flaggedUsers.success'))

                FlowRouter.go('/moderator/flagged-users')
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.flaggedUsers.suspended'))

            	FlowRouter.go('/moderator/flagged-users')
            }
        })
    }
})
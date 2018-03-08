import { Template } from 'meteor/templating'
import { UserData } from '../../../../lib/database/UserData'
import { FlowRouter } from 'meteor/staringatlights:flow-router';

import '../../layouts/MainBody.html'
import './flaggedUsers.template.html'

Template.flaggedUsers.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('userData')
		SubsCache.subscribe('users')
	})
})

// to prevent code redundancy, we create a method to determine active flags
const activeFlags = function() {
	let flags = []

	// we can only nest two levels
	Object.keys(this.info.flags || {}).forEach(i => {
		if (typeof this.info.flags[i] === 'object') {
			Object.keys(this.info.flags[i]).forEach(j => {
				if (this.info.flags[i][j]) {
					flags.push(`${i}.${j}`)
				}
			})
		} else {
			if (this.info.flags[i]) {
				flags.push(i)
			}
		}
	})

	return flags.toString()
}

Template.flaggedUsers.helpers({
	users: () => {
		return Meteor.users.find({}).fetch().map(i => {
			return {
				user: i,
				info: (UserData.findOne({
					_id: i._id
				}) || {})
			}
		}).filter(i => {
			return activeFlags.call(i) !== ''
		})
	},
	lastAccess: function() {
		return new Date(((this.info.sessionData || []).pop() || {}).time || 0).toString()
	},
	ipAddress: function() {
		return ((this.info.sessionData || []).pop() || {}).loggedIP
	},
	activeFlags: function() {
		return activeFlags.call(this)
	}
})

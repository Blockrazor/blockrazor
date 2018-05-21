import { Template } from 'meteor/templating'
import { UserData, ActivityIPs } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import './flaggedUsers.html'

Template.flaggedUsers.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('userData')
		SubsCache.subscribe('users')
		SubsCache.subscribe('activityIPs')
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

	return flags
}

Template.flaggedUsers.helpers({
	ipAddresses: function() {
		let users = Meteor.users.find({
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
			return _.intersection(activeFlags.call(i), ['duplicate.createdIP', 'duplicate.accessIP']).length > 0 // find all users with flags
		})

		let ips = _.uniq(_.flatten(users.map(i => ((i.info.sessionData || []).map(j => j.loggedIP))))) // return all flagged ip addresses
		let ignored = ActivityIPs.find({
			ignored: true,
			time: {
				$gt: new Date() - 1000*60*60*24*30
			}
		}).fetch().map(i => i.ip)

		ips = ips.filter(i => !~ignored.indexOf(i)) // filter out ignored ips

		return ips.map(i => {
			let us = users.filter(j => j.info.sessionData && j.info.sessionData.some(k => k.loggedIP === i))

			console.log(us)

			if (us.length > 1) {
				return {
					ip: i,
					lastAccess: moment(us.map(i => i.info.sessionData[i.info.sessionData.length - 1].time).sort((i1, i2) => i2 - i1)[0]).fromNow(),
					users: us.length
				}
			} else {
				return false
			}
		}).filter(i => !!i)
	}
})

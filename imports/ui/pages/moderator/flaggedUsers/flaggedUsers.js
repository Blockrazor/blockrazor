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

	this.sort = new ReactiveVar('user-desc')
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

Template.flaggedUsers.events({
	'change #js-sort': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.sort.set($(event.currentTarget).val())
    }
})

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
			$or: [{
				time: {
					$gt: new Date() - 1000*60*60*24*30
				}
			}, {
				whitelist: true
			}]
		}).fetch().map(i => i.ip)

		ips = ips.filter(i => !~ignored.indexOf(i)) // filter out ignored ips

		return ips.map(i => {
			let us = users.filter(j => j.info.sessionData && j.info.sessionData.some(k => k.loggedIP === i))

			if (us.length > 1) {
				const lastAccess = us.map(i => i.info.sessionData[i.info.sessionData.length - 1].time).sort((i1, i2) => i2 - i1)[0]
				const ip = ActivityIPs.findOne({
					ip: i
				}) || {}

				return {
					ip: i,
					lastAccess: moment(lastAccess).fromNow(),
					lastAccessIP: ip.lastAccess ? moment(ip.lastAccess).fromNow() : '-',
					users: us.length,
					lastAccessSort: lastAccess,
					lastAccessIPSort: ip.lastAccess || 0
				}
			} else {
				return false
			}
		}).filter(i => !!i).sort((i1, i2) => {
			let sort = Template.instance().sort.get()

			if (sort === 'user-desc') return i2.lastAccessSort - i1.lastAccessSort
			if (sort === 'user-asc') return i1.lastAccessSort - i2.lastAccessSort
			if (sort === 'ip-desc') return i2.lastAccessIPSort - i1.lastAccessIPSort
			if (sort === 'ip-asc') return i1.lastAccessIPSort - i2.lastAccessIPSort
		})
	}
})

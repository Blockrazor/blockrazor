import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/staringatlights:flow-router'
import { Currencies, UserData, Features, HashPower } from '/imports/api/indexDB.js'

import './userProfile.html'

Template.userProfile.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('user', FlowRouter.getParam('slug'))
		SubsCache.subscribe('userdataSlug', FlowRouter.getParam('slug'))
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('comments')
		SubsCache.subscribe('hashpower')

		this.user = Meteor.users.findOne({
			slug: FlowRouter.getParam('slug')
		})
	})
})

Template.userProfile.helpers({
		isYourPage() {
		    if (FlowRouter.getParam('slug') == Meteor.user().slug) {
		        return true;
		    }
		},
    balance() {
      let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
      return Number( balance.toPrecision(3) )
  	},
	hashPowerUploadDirectoryPublic: () => _hashPowerUploadDirectoryPublic,
	user: () => Template.instance().user,
	val: val => val || '-',
	roles: () => {
		let roles = []

		let userData = UserData.findOne({
			_id: (Template.instance().user || {})._id
		})

		if (userData) {
			if (userData.moderator) {
				roles.push('moderator')
			}

			if (userData.developer) {
				roles.push('developer')
			}
		}

		return roles.toString()
	},
	userData: () => {
		return UserData.findOne({
			_id: (Template.instance().user || {})._id
		}) || {}
	},
		HashPower: () => {
		return HashPower.find({createdBy:Meteor.userId()})
		 
	},
	currencies: () => {
		return Currencies.find({
			owner: (Template.instance().user || {})._id
		}).fetch()
	},
	comments: () => {
		return Features.find({
			comment: {
	          $exists: true
	        },
			createdBy: (Template.instance().user || {})._id
		}, {
			sort: {
				createdAt: -1
			},
			limit: 10 // show 10 lates comments
		}).fetch()
	},
	commentMeta: function() {
		// we have to find comment's parent in order to see its metadata (e.g. where it was posted)
		let depth = this.depth
		let feature = this

		// iterate by depth
		while (depth-- > 0) {
			feature = Features.findOne({
				_id: feature.parentId
			})
		}

		feature['currency'] = (Currencies.findOne({
			_id: feature.currencyId
		}) || {}).currencyName

		return feature
	}
})
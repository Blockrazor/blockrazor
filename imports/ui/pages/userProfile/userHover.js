import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/staringatlights:flow-router'
import { Currencies, UserData, Features } from '/imports/api/indexDB.js'

import '../../layouts/MainBody.html'
import './userHover.template.html'

Template.userHover.onCreated(function() {
	this.autorun(() => {
		this.userId = this.data.createdBy // || this.data.owner || this.data.author,... // userId depends on the passed context, so we can use the || operator to support multiple values if needed

		SubsCache.subscribe('user', this.userId)
		SubsCache.subscribe('userdataId', this.userId)
	})
})

Template.userHover.helpers({
	user: () => Meteor.users.findOne({
		_id: Template.instance().userId
	}),
	userData: () => {
		return UserData.findOne({
			_id: Template.instance().userId
		}) || {}
	}
})
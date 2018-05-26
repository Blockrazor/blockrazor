import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import { colStub } from '/client/main'

UserData = Features = colStub

import './userHover.html'

Template.userHover.onCreated(async function() {
	({ Features, UserData } = (await import('/imports/api/indexDB')));
	if (colStub !== undefined) { colStub.change() }

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
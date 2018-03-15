import { Template } from 'meteor/templating'
import { AppLogs } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './appLogs.template.html'

Template.appLogs.onCreated(function() {
	this.page = 1

	this.autorun(() => {
		SubsCache.subscribe('applogs', this.page, 100)
		SubsCache.subscribe('users')
	})

	this.filter = new ReactiveVar('')
	this.level = new ReactiveVar('ALL')
})

Template.appLogs.events({
	'keyup #js-search': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.filter.set($(event.currentTarget).val())
	},
	'change #js-level': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.level.set($(event.currentTarget).val())
	},
	'click #js-more': (event, templateInstance) => {
		event.preventDefault()

		Meteor.subscribe('applogs', ++Template.instance().page, 100)
	}
})

Template.appLogs.helpers({
	applogs: () => {
		return AppLogs.find({
			level: new RegExp(Template.instance().level.get() === 'ALL' ? '' : Template.instance().level.get(), 'i'),
			message: new RegExp(Template.instance().filter.get(), 'ig')
		}, {
			sort: {
				date: -1
			}
		})
	},
	levelColor: function() {
		return this.level === 'INFO' ? 'green' : this.level === 'WARN' ? 'orange' : 'red'
	},
	date: function() {
		return moment(this.date).format(`${_globalDateFormat} HH:MM:SS`)
	},
	user: function() {
		return (Meteor.users.findOne({
			_id: this.userId
		}) || {}).username || 'N\\A'
	},
	additionalInfo: function() {
		return this.additional.connection ? `IP: ${this.additional.connection.clientAddress}` : 'N\\A'
	}
})

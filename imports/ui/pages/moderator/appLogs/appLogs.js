import { Template } from 'meteor/templating'
import { AppLogs } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './appLogs.html'


Template.appLogs.onCreated(function() {
	this.page = 1

	this.autorun(() => {
		SubsCache.subscribe('applogs', this.page, 100)
		SubsCache.subscribe('users')
	})

	this.filter = new ReactiveVar('')
	this.filterUsername = new ReactiveVar("")
	this.filterIp = new ReactiveVar("")
	this.level = new ReactiveVar('ALL')
})

Template.appLogs.onRendered(function() {
	$('#all-logs').prop('checked', true)
})

Template.appLogs.events({
	'click .form-check-input': (event, templateInstance) => {
		templateInstance.$('input:checked').each(function() {
			if ($(this).val() !== $(event.currentTarget).val()) {
				$(this).prop('checked', false);
			}
		});

		templateInstance.level.set($(event.currentTarget).val())
	}, 
	'keyup #js-search': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.filter.set($(event.currentTarget).val())
	},
	'keyup #js-search-username': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.filterUsername.set($(event.currentTarget).val())
	},
	'keyup #js-search-ip': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.filterIp.set($(event.currentTarget).val())
	},
	'click #js-more': (event, templateInstance) => {
		event.preventDefault()

		Meteor.subscribe('applogs', ++Template.instance().page, 100)
	}
})

Template.appLogs.helpers({
	applogs: () => {
		var templ = Template.instance()
		var query = {
			level: new RegExp(templ.level.get() === 'ALL' ? '' : templ.level.get(), 'i'),
			$or : [ 
				{ message: new RegExp(templ.filter.get(), 'ig') },
				{"additional.user.username" : new RegExp(templ.filter.get(), 'ig')}, 
				{"additional.user.user.username" : new RegExp(templ.filter.get(), 'ig')},
				{"additional.connection.clientAddress" : new RegExp(templ.filter.get(), 'ig') }
			]
		}
		
		console.log(query)
		return AppLogs.find( query, {
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
	},
	loadMore: (data) => {
		if (data.count() > 0) { return true }
		return
	}
})

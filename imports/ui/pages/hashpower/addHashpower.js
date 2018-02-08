import { Template } from 'meteor/templating';
import { FormData } from '../../../../lib/database/FormData'
import { HashHardware } from '../../../../lib/database/HashHardware'
import { HashAlgorithm } from '../../../../lib/database/HashAlgorithm'
import { FlowRouter } from 'meteor/kadira:flow-router'

import '../../layouts/MainBody.html'
import './addHashpower.template.html'

Template.addHashpower.onCreated(function() {
	this.autorun(() => {
		this.subscribe('formdata')
		this.subscribe('hashhardware')
		this.subscribe('hashalgorithm')
	})

	this.addHw = new ReactiveVar(false)
	this.addAlgo = new ReactiveVar(false)
})

Template.addHashpower.helpers({
	hwDevices: () => HashHardware.find({}).fetch(),
	hwAlgo: () => HashAlgorithm.find({}).fetch(),
	addHw: () => Template.instance().addHw.get() ? 'block' : 'none',
	addAlgo: () => Template.instance().addAlgo.get() ? 'block' : 'none'
})

Template.addHashpower.events({
	'click #js-add-hw': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.addHw.set(!templateInstance.addHw.get())
	},
	'click #js-add-algo': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.addAlgo.set(!templateInstance.addAlgo.get())
	},
	'click #js-add': (event, templateInstance) => {
		event.preventDefault()

		const f = (device, algo) => {
			Meteor.call('addHashpower', $('#js-hw-cat').val(), device, algo, $('#js-hr').val() || 0, $('#js-unit').val(), $('#js-pc').val(), (err, data) => {
				if (!err) {
					FlowRouter.go('/hashpower')
				} else {
					sAlert.error(err.reason)
				}
			})
		} // to prevent redundant code, we simply create a function that will be called in both cases with a different parameter

		if ($('#js-hw-new').val() && $('#js-algo-new').val()) {
			Meteor.call('addHardware', $('#js-hw-new').val(), (err, hw) => {
				if (!err) {
					Meteor.call('addAlgo', $('#js-algo-new').val(), (err, algo) => {
						if (!err) {
							f(hw, algo)
						} else {
							sAlert.error(err.reason)
						}
					})
				} else {
					sAlert.error(err.reason)
				}
			})
		} else if ($('#js-hw-new').val() || $('#js-algo-new').val()) {
			Meteor.call(`add${$('#js-hw-new').val() ? 'Hardware' : 'Algo'}`, $('#js-hw-new').val() || $('#js-algo-new').val(), (err, data) => {
				if (!err) {
					f($('#js-hw-new').val() ? data : $('#js-hw-dev').val(), $('#js-algo-new').val() ? data : $('#js-algo').val())
				} else {
					sAlert.error(err.reason)
				}
			})
		} else {
			f($('#js-hw-dev').val(), $('#js-algo').val())
		}
	}
})
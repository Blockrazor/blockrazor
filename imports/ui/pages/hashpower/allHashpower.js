import { Template } from 'meteor/templating';
import { HashHardware, HashAlgorithm, HashPower, HashUnits, UserData } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/staringatlights:flow-router';

import '../../layouts/MainBody.html'
import './allHashpower.template.html'

Template.allHashpower.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('hashpower')
		SubsCache.subscribe('hashhardware')
		SubsCache.subscribe('hashalgorithm')
		SubsCache.subscribe('hashunits')
	})

	this.flags = new ReactiveVar([])
})

Template.allHashpower.helpers({
	hashpower: () => HashPower.find({}).fetch(),
	hashDevice: function() {
		return (HashHardware.findOne({
			_id: this.device
		}) || {}).name || ''
	},
	hashAlgorithm: function() {
		return (HashAlgorithm.findOne({
			_id: this.hashAlgorithm
		}) || {}).name || ''
	},
	unit: function() {
		return (HashUnits.findOne({
			_id: this.unit
		}) || {}).name || ''
	},
	canDelete: function() {
		return this.createdBy === Meteor.userId()
	},
	canFlag: function() {
		return this.createdBy !== Meteor.userId() // can't flag your own submission
	},
	image: function() {
	    if (this.image) {
	        return `${_hashPowerUploadDirectoryPublic}${this.image}`
	    } else {
	        return '/images/noimage.png'
	    }
	},
	showFlagReason: function() {
		return ~Template.instance().flags.get().indexOf(this._id) ? 'block' : 'none'
	}
})

Template.allHashpower.events({
	'click .js-flag': function(event, templateInstance) {
		let l = templateInstance.flags.get()

		if (!~l.indexOf(this._id)) {
			l.push(this._id)
		} else {
			l = l.filter(i => i !== this._id)
		}

		templateInstance.flags.set(l)
	},
	'click .js-flag-cont': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('flagHashpower', this._id, $(`#js-flag-reason-${this._id}`).val(), (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} else {
				sAlert.success('Flagged successfully.')

				// remove the reason field
				let l = templateInstance.flags.get()
				l = l.filter(i => i !== this._id)
				templateInstance.flags.set(l)
			}
		})		
	},
	'click .js-delete': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('deleteHashpower', this._id, (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} 
		})		
	}
})
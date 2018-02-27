import { Template } from 'meteor/templating';
import { HashHardware } from '../../../../lib/database/HashHardware'
import { HashPower } from '../../../../lib/database/HashPower'
import { HashAlgorithm } from '../../../../lib/database/HashAlgorithm'
import { HashUnits } from '../../../../lib/database/HashUnits'
import { FlowRouter } from 'meteor/kadira:flow-router'

import '../../layouts/MainBody.html'
import './flaggedHashpower.template.html'

Template.flaggedHashpower.onCreated(function() {
	this.autorun(() => {
		this.subscribe('flaggedhashpower')
		this.subscribe('hashhardware')
		this.subscribe('hashalgorithm')
		this.subscribe('hashunits')
	})

	this.flags = new ReactiveVar([])
})

Template.flaggedHashpower.helpers({
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
	image: function() {
	    if (this.image) {
	        return `${_hashPowerUploadDirectoryPublic}${this.image}`
	    } else {
	        return '/images/noimage.png'
	    }
	}
})

Template.flaggedHashpower.events({
	'click .js-delete': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('deleteHashpower', this._id, (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} 
		})		
	}
})
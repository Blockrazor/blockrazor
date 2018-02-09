import { Template } from 'meteor/templating';
import { HashHardware } from '../../../../lib/database/HashHardware'
import { HashPower } from '../../../../lib/database/HashPower'
import { HashAlgorithm } from '../../../../lib/database/HashAlgorithm'
import { HashUnits } from '../../../../lib/database/HashUnits'
import { UserData } from '../../../../lib/database/UserData'
import { FlowRouter } from 'meteor/kadira:flow-router'

import '../../layouts/MainBody.html'
import './allHashpower.template.html'

Template.allHashpower.onCreated(function() {
	this.autorun(() => {
		this.subscribe('hashpower')
		this.subscribe('hashhardware')
		this.subscribe('hashalgorithm')
		this.subscribe('hashunits')
	})
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
		return this.createdBy === Meteor.userId() || (UserData.findOne({
			_id: Meteor.userId()
		}) || {}).moderator
	}
})

Template.allHashpower.events({
	'click .js-delete': function(event, templateInstnace) {
		event.preventDefault()

		Meteor.call('deleteHashpower', this._id, (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} 
		})		
	}
})
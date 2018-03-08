import { Template } from 'meteor/templating';
import { HashAverage } from '../../../../lib/database/HashAverage'
import { HashAlgorithm } from '../../../../lib/database/HashAlgorithm'

import '../../layouts/MainBody.html'
import './allHashaverage.template.html'

Template.allHashaverage.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('hashaverage')
		SubsCache.subscribe('hashalgorithm')
	})
})

Template.allHashaverage.helpers({
	hashaverage: () => HashAverage.find({}).fetch(),
	hashAlgorithm: function() {
		return (HashAlgorithm.findOne({
			_id: this.algorithm
		}) || {}).name || ''
	},
	average: function() {
		return isNaN(this.average) ? 'N\\A' : `${this.average} W`
	}
})

Template.allHashaverage.events({
	'click #js-update': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('updateAverages', (err, data) => {})
	}
})
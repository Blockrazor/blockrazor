import { Template } from 'meteor/templating';
import { HashAverage, HashAlgorithm } from '/imports/api/indexDB.js'

import './allHashaverage.html'

Template.allHashaverage.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('hashaverage')
		SubsCache.subscribe('hashalgorithm')
	})

	//send an event to segment
        let payload = {
            event: 'Opened all hash average',
        }

        // segmentEvent(payload);
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
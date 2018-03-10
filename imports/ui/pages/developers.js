import { Template } from 'meteor/templating'
import { Developers } from '/imports/api/indexDB.js'

import './developers.html'

Template.developers.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('developers')
    })
})

Template.developers.helpers({
	developers: () => Developers.find({
		processed: false
	}),
	notEmpty: () => Developers.find({
		processed: false
	}).count() > 0
})

Template.developers.events({
	'click #approve': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('reviewDeveloper', this.userId, true, (err, data) => {})
	},
	'click #reject': function(event, templateInstance) {
		event.preventDefault()

		Meteor.call('reviewDeveloper', this.userId, false, (err, data) => {})
	} 
})
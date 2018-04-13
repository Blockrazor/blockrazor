import { Template } from 'meteor/templating'

import './distribution.html'

Template.distribution.onCreated(function() {
	this.earnings = new ReactiveVar({
		'oneMonth': 0.00,
		'sixMonths': 0.00,
		'oneYear': 0.00
	})
	this.spendings = new ReactiveVar({
		'oneMonth': 0.00,
		'sixMonths': 0.00,
		'oneYear': 0.00
	})

    Meteor.call('calculateEarnings', (err, data) => {
    	if (!err) {
    		this.earnings.set(data)
    	}
    })

    Meteor.call('calculateSpendings', (err, data) => {
    	if (!err) {
    		this.spendings.set(data)
    	}
    })
})

Template.distribution.helpers({
	earnings: () => Template.instance().earnings.get() || {},
	spendings: () => Template.instance().spendings.get() || {}
})

import { Meteor } from 'meteor/meteor'

Meteor.startup(() => {
	SyncedCron.add({
	    name: 'Drain the top currency',
	    schedule: (parser) => parser.text('every 1 minutes'),
	    job: () => Meteor.call('drainTopAuction', 'top-currency', 0.01) // drain rate is 0.01 KZR per minute
	})
})
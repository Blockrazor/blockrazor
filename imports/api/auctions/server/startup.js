import { Meteor } from 'meteor/meteor'

Meteor.startup(() => {
	SyncedCron.add({
	    name: 'Drain the top currency',
	    schedule: (parser) => parser.text('every 1 minutes'),
	    job: () => Meteor.call('drainTopAuction', 'top-currency', 0.01, (err, data) => {}) // drain rate is 0.01 KZR per minute
	})
	SyncedCron.add({
	    name: 'Check auctions',
	    schedule: (parser) => parser.text('every 1 minutes'),
	    job: () => Meteor.call('checkAuctions', (err, data) => {}) // drain rate is 0.01 KZR per minute
	})
})
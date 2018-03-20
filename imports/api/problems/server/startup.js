import { Meteor } from 'meteor/meteor'

Meteor.startup(() => {
	SyncedCron.add({
	    name: 'Clean taken problems',
	    schedule: (parser) => parser.text('every 1 hour'),
	    job: () => Meteor.call('cleanTakenProblems', (err, data) => {}) // drain rate is 0.01 KZR per minute
	})
})
import { Meteor } from 'meteor/meteor'

Meteor.startup(() => {
	SyncedCron.add({
	    name: 'Reward top features, comments and redflags',
	    schedule: (parser) => parser.cron('0 * * * *'),
	    job: () => Meteor.call('rewardAll', 0.1, (err, data) => {}) // reward is 0.1 KZR per hour
	})
})
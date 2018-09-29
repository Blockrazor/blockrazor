import { Mongo } from 'meteor/mongo'

Meteor.startup(() => {
    SyncedCron.add({
        name: 'Try to send a PR with new translations',
        schedule: (parser) => parser.cron('0 1 * * *'),
        job: () => Meteor.call('sendDailyPRRequest', (err, data) => {})
    })
})

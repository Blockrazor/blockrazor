import { Mongo } from 'meteor/mongo'

Meteor.startup(() => {
    SyncedCron.add({
        name: 'Fetch related github repos',
        schedule: (parser) => parser.cron('0 1 * * *'), // every day will be sufficient
        job: () => Meteor.call('fetchRelatedGithubRepos', (err, data) => {})
    })
})

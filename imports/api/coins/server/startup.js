import { Mongo } from 'meteor/mongo'

Meteor.startup(() => {
    SyncedCron.add({
        name: 'Fetch related github repos',
        schedule: (parser) => parser.cron('0 0 * * 0'), // every 7 days will be sufficient
        job: () => Meteor.call('fetchRelatedGithubRepos', (err, data) => {})
    })
})

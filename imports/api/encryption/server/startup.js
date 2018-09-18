import { Mongo } from 'meteor/mongo'
import { Encryption } from '../../indexDB'

Meteor.startup(() => {
    SyncedCron.add({
        name: 'Check for the dead man trigger activation',
        schedule: (parser) => parser.cron('0 */1 * * *'), // every hour will be sufficient
        job: () => Meteor.call('checkDeadmanTrigger', (err, data) => {})
    })
})

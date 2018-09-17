import { UserPresence } from 'meteor/socialize:user-presence'
import { Mongo } from 'meteor/mongo'
import { developmentValidationEnabledFalse, UsersStats } from '../../indexDB'
import SimpleSchema from 'simpl-schema'

const stats = UsersStats.find().fetch()

if (stats.length != 4) {
    UsersStats.remove({})

    UsersStats.insert({
        _id: 'connected', 
        userIds: []
    })
    UsersStats.insert({
        _id: "created",
        created: Meteor.users.find().count()
    })
    UsersStats.insert({
        _id: "lastMonth",
        created: Meteor.users.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30) /* 30 days */).length
    })
    Meteor.call('commentsLastMonth', (err, data) => {
        UsersStats.insert({
            _id: 'lastMonthComments',
            created: data || 0
        })
    })
}

UserPresence.onUserOnline(function(userId, connection) {
    UsersStats.update("connected", {
        $addToSet: {
            userIds: userId
        }
    })
})

UserPresence.onUserOffline(function(userId) {
    UsersStats.update("connected", {
        $pull: {
            userIds: userId
        }
    })
})

Meteor.startup(() => {
    SyncedCron.add({
        name: 'Count newly registered users',
        schedule: (parser) => parser.cron('0 */3 * * *'), // every 3 hours will be sufficient
        job: () => Meteor.call('signedUpLastMonth', (err, data) => {
            UsersStats.update({
                _id: 'lastMonth'
            }, {
                $set: {
                    created: data || 0
                }
            })
        })
    })

    SyncedCron.add({
        name: 'Count new comments',
        schedule: (parser) => parser.cron('0 */3 * * *'), // every 3 hours will be sufficient
        job: () => Meteor.call('commentsLastMonth', (err, data) => {
            UsersStats.update({
                _id: 'lastMonthComments'
            }, {
                $set: {
                    created: data || 0
                }
            })
        })
    })

    SyncedCron.add({
        name: 'Fetch moderator candidates',
        schedule: (parser) => parser.cron('0 1 * * *'), // every 24 hours at 1am
        job: () => Meteor.call('possibleModerators', (err, data) => {})
    })
})

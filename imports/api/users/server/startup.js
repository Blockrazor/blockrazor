import { UserPresence } from 'meteor/socialize:user-presence'
import { Mongo } from 'meteor/mongo'
import { developmentValidationEnabledFalse, UsersStats } from '../../indexDB'
import SimpleSchema from 'simpl-schema'

var stats = UsersStats.find().fetch()
if (stats.length != 3){
  UsersStats.remove({})
  UsersStats.insert({_id: "connected", connected: 0, userIds: []})
  UsersStats.insert({_id: "created", created: Meteor.users.find().count()})
  UsersStats.insert({_id: "lastMonth", created: Meteor.users.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30) /* 30 days */).length})
}

//used to prevent edits to connected field parsed from userIds field on every running instance when observer triggers
var connectedLength = new Set(UsersStats.findOne("connected", {fields: {userIds: 1}}).userIds)

UsersStats.find({_id: "connected"}, {fields: {userIds: 1}}).observeChanges({
  changed(id, fields){
    if (connectedLength.size == fields.userIds.length){
    } else {
      connectedLength = new Set(fields.userIds)
    }
    return  
  }
})

//will fire several times per user thus requires observer
UserPresence.onUserOnline(function(userId, connection){
  var len = connectedLength.size
  connectedLength.add(userId)
  if (len != connectedLength.size){
    UsersStats.update("connected", {$addToSet: {userIds: userId}, $inc: {connected: 1}})
  }
})

UserPresence.onUserOffline(function (userId) {
  var len = connectedLength.size
  connectedLength.delete(userId)
  if (len != connectedLength.size){
    UsersStats.update("connected", {$pull: {userIds: userId}, $inc: {connected: -1}})
  }
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
      }) // reward is 0.1 KZR per hour
  })
})

import { Mongo } from 'meteor/mongo'
import { UserPresence } from 'meteor/socialize:user-presence';

export const UsersStats = new Mongo.Collection('usersStats')

if (Meteor.isServer){
  var stats = UsersStats.find().fetch()
  if (stats.length != 2){
    UsersStats.remove({})
    UsersStats.insert({_id: "connected", connected: 0, userIds: []})
    UsersStats.insert({_id: "created", created: Meteor.users.find().count()})
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
});

UserPresence.onUserOffline(function (userId) {
  var len = connectedLength.size
  connectedLength.delete(userId)
  console.log("init", connectedLength, len, connectedLength.size)
  if (len != connectedLength.size){
    console.log("removing", len)
    UsersStats.update("connected", {$pull: {userIds: userId}, $inc: {connected: -1}})
  }
});

//called in Accounts.onCreated hook in users.js
export const updateUsersStats = (options, user) => {
  UsersStats.update("created", {$inc: {created: 1}})
};
}
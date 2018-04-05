import { UserPresence } from 'meteor/socialize:user-presence';
import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const UsersStats = new Mongo.Collection('usersStats')

if (Meteor.isServer){
Meteor.startup(function(){
  var stats = UsersStats.find().fetch()
  if (stats.length != 2){
    if (stats.find(x=>x._id == "connected") == undefined){
      UsersStats.insert({_id: "connected", connected: 0})
    } 
    if (stats.find(x=>x._id == "created") == undefined) {
      UsersStats.insert({_id: "created", created: Meteor.users.find().count()})
    }
  }
})


UsersStats.find({_id: "connected"}, {fields: {userIds: 1}}).observeChanges({
  changed(id, fields){
    UsersStats.update("connected", {$set: {connected: fields.userIds.length}})
    return 
  }
})

//will fire several times per user thus requires observer
UserPresence.onUserOnline(function(userId, connection){
  // console.log(userId, connection.id)
  UsersStats.update("connected", {$addToSet: {userIds: userId}})
});

UserPresence.onUserOffline(function (userId) {
  UsersStats.update("connected", {$pull: {userIds: userId}})
});

//called in Accounts.onCreated hook in users.js
export const updateUsersStats = (options, user) => {
  UsersStats.update("created", {$inc: {created: 1}})
};
}

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

UsersStats.schema = new SimpleSchema({
  _id: { type: String }, 
  connected: { type: Integer, required: false }, 
  userIds: { type: Array, required: false }, 
  "userIds.$": { type: Id },
  created: { type: Integer, required: false }, 
}, { requiredByDefault: developmentValidationEnabledFalse });

UsersStats.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
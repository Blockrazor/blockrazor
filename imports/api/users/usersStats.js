import { UserPresence } from 'meteor/socialize:user-presence';
import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const UsersStats = new Mongo.Collection('usersStats')

//called in Accounts.onCreated hook in users.js
export const updateUsersStats = (options, user) => {
  UsersStats.update("created", {$inc: {created: 1}})
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
import { Mongo } from 'meteor/mongo'
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema'

export const ActivityIPs = new Mongo.Collection('activityips');

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

/*ActivityIPs.schema = new SimpleSchema({
  _id: { type: Id },
  time: { type: Integer },
  owner: { type: Id },
  type: { type: String },
  from: { type: String },
  content: { type: String },
  read: { type: Boolean },
}, { requiredByDefault: developmentValidationEnabledFalse });
*/
ActivityIPs.deny({
  insert: () => true,
  update: () => true,
  remove: () => true
})
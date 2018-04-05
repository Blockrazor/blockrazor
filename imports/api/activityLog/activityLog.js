import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const ActivityLog = new Mongo.Collection('activitylog');

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

ActivityLog.schema = new SimpleSchema({
  _id: { type: Id },
  time: { type: Integer },
  owner: { type: Id },
  type: { type: String },
  from: { type: String },
  content: { type: String },
  read: { type: Boolean },
}, { requiredByDefault: developmentValidationEnabledFalse });

ActivityLog.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
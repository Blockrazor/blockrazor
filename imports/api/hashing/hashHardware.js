import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const HashHardware = new Mongo.Collection('hashhardware')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

HashHardware.schema = new SimpleSchema({
  _id: { type: Id },
  name: { type: String },
}, { requiredByDefault: developmentValidationEnabledFalse });

HashHardware.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
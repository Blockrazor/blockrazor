import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const HashUnits = new Mongo.Collection('hashunits')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

HashUnits.schema = new SimpleSchema({
  _id: { type: Id },
  name: { type: String },
}, { requiredByDefault: developmentValidationEnabledFalse });

HashUnits.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
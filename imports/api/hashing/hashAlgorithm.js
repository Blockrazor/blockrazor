import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const HashAlgorithm = new Mongo.Collection('hashalgorithm')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

HashAlgorithm.schema = new SimpleSchema({
  _id: { type: Id },
  name: { type: String },
}, { requiredByDefault: developmentValidationEnabledFalse });

HashAlgorithm.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Developers = new Mongo.Collection('developers')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

Developers.schema = new SimpleSchema({
  _id: { type: Id },
  userId: { type: Id },
  username: { type: String },
  processed: { type: Boolean },
  proofs: { type: Array },
  "proofs.$": { type: Object },
  "proofs.$.service": { type: String },
  "proofs.$.profile": { type: Domain },
}, { requiredByDefault: developmentValidationEnabledFalse });


Developers.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
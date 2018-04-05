import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const HashPower = new Mongo.Collection('hashpower')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

HashPower.schema = new SimpleSchema({
  _id: { type: Id }, 
  hashCategory: { type: String }, 
  device: { type: Id }, 
  hashAlgorithm: { type: Id }, 
  hashRate: { type: Number },
  unit: { type: Id }, 
  powerConsumption: { type: Number },
  createdBy: { type: Id }, 
  createdAt: { type: Integer },
  flags: { type: Array },
  "flags.$": { type: Object }, 
  "flags.$.reason": { type: String }, 
  "flags.$.userId": { type: Id }, 
  "flags.$.date": { type: Integer }, 
  scores: { type: Integer },
  upvotes: { type: Integer },
  votes: { type: Array },
  "votes.$": { type: Object }, 
  "votes.$.userId": { type: Id }, 
  "votes.$.type": { type: String }, 
  "votes.$.loggedIP": { type: String }, 
  "votes.$.time": { type: Integer },
}, { requiredByDefault: developmentValidationEnabledFalse });

HashPower.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
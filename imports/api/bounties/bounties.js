import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Bounties = new Mongo.Collection('bounties');

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

Bounties.schema = new SimpleSchema({
  _id: { type: String },
  problem: { type: String },
  solution: { type: String },
  currencyName: { type: String },
  pendingApproval: { type: Boolean },
  currentlyAvailable: { type: Boolean },
  url: { type: String },
  time: { type: Integer },
  multiplier: { type: Number },
  types: {type: Object},
  "types.heading": {type: String},
  "types.rules": {type: String}
}, { requiredByDefault: developmentValidationEnabledFalse });

Bounties.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
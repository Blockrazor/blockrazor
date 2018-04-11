import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Bids = new Mongo.Collection('bids')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

Bids.schema = new SimpleSchema({
  _id: { type: Id },
  auctionId: { type: String },
  userId: { type: String },
  options: { type: Object },
  "options.type": { type: String, required: false },
  "options.currency": { type: String },
  amount: {type: Number},
  date: {type: Integer}
}, { requiredByDefault: developmentValidationEnabledFalse });

Bids.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
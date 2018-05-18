import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Auctions = new Mongo.Collection('auctions')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

Auctions.schema = new SimpleSchema({
  _id: { type: Id },
  name: { type: String },
  description: { type: String },
  options: { type: Object },
  "options.amount": { type: Integer },
  "options.baseCurrency": { type: String },
  "options.acceptedCurrency": { type: String },
  "options.timeout": { type: Integer },
  "options.reserve": { type: Number },
  "options.reserveMet": {type: Boolean},
  "options.highest": {type: Number},
  'options.highestBidder': {type: String},
  'options.max': {type: Number},
  createdBy: {type: String},
  createdAt: {type: String},
  bids: { type: Array },
  'bids.$': { type: Object },
  'bids.$.userId': { type: String },
  'bids.$.amount': { type: Number }
}, { requiredByDefault: developmentValidationEnabledFalse });

Auctions.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
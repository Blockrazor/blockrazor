import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Wallet = new Mongo.Collection('wallet');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Wallet.schema = new SimpleSchema({
  _id: { type: Id }, 
  time: { type: Integer },
  owner: { type: Id },
  type: { type: String },
  from: { type: String },
  message: { type: String },
  amount: { type: Number },
}, { requiredByDefault: developmentValidationEnabledFalse });

Wallet.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
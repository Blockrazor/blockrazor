import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse, PendingCurrencies } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const RejectedCurrencies = new Mongo.Collection('rejectedcurrencies');

var { Integer, RegEx, oneOf } = SimpleSchema
var { Id, Domain } = RegEx

RejectedCurrencies.schema = new SimpleSchema(
  PendingCurrencies.schema.extend(
    new SimpleSchema({
      rejected: { type: Boolean },
      rejectedReason: { type: String },
      rejectedBy: { type: Id }
    })
  ), { requiredByDefault: developmentValidationEnabledFalse }
);


RejectedCurrencies.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});

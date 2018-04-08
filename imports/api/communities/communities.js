import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Communities = new Mongo.Collection('communities')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

Communities.schema = new SimpleSchema({
  _id: { type: Id },
  url: { type: Domain },
  currencyId: { type: Id },
  currencyName: { type: String },
  image: { type: String },
  createdAt: { type: Number },
  createdBy: { type: Id },
}, { requiredByDefault: developmentValidationEnabledFalse });


Communities.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
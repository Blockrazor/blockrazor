import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Summaries = new Mongo.Collection('summaries')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Summaries.schema = new SimpleSchema({
  _id: { type: Id }, 
  currencyId: { type: Id }, 
  currencySlug: { type: String }, 
  summary: { type: String }, 
  appeal: { type: Integer }, 
  appealNumber: { type: Integer }, 
  appealVoted: { type: Array, required: false }, 
  "appealVoted.$": { type: Id }, 
  createdAt: { type: Integer }, 
  author: { type: String }, 
  createdBy: { type: Id }, 
  rating: { type: Integer }, 
}, { requiredByDefault: developmentValidationEnabledFalse });

Summaries.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
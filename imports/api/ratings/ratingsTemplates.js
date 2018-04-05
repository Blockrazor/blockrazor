import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const RatingsTemplates = new Mongo.Collection('ratings_templates');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

RatingsTemplates.schema = new SimpleSchema({
  _id: { type: Id }, 
  question: { type: String }, 
  catagory: { type: String, allowedValues: ["wallet", "community", "decentralization", "codebase"] }, 
  createdBy: { type: Id }, 
  createdAt: { type: Integer }, 
  negative: { type: Boolean }, 
  context: { type: String }, 
  xors: { type: Array }, 
  "xors.$": { type: String },  
}, { requiredByDefault: developmentValidationEnabledFalse });

RatingsTemplates.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});

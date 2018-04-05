import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const ProblemComments = new Mongo.Collection('problemComments')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

ProblemComments.schema = new SimpleSchema({
  _id: { type: Id }, 
  problemId: { type: Id }, 
  parentId: { type: String, required: false }, 
  depth: { type: Integer }, 
  createdBy: { type: Id }, 
  author: { type: String }, 
  date: { type: Integer }, 
  text: { type: String }, 
  appeal: { type: Integer }, 
  appealNumber: { type: Integer }, 
  appealVoted: { type: Array }, 
  "appealVoted.$": { type: String , required: false }, 
  rating: { type: Integer }, 
}, { requiredByDefault: developmentValidationEnabledFalse });

ProblemComments.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
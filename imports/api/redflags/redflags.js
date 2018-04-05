import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Redflags = new Mongo.Collection('redflags');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Redflags.schema = new SimpleSchema({
  _id: { type: Id }, 
  currencyId: { type: Id }, 
  name: { type: String }, 
  appeal: { type: Integer }, 
  appealNumber: { type: Integer }, 
  appealVoted: { type: Array }, 
  "appealVoted.$": { type: Id, required: false }, 
  flags: { type: Integer }, 
  flagRatio: { type: Number }, 
  flaggedBy: { type: Array }, 
  "flaggedBy.$": { type: Id, required: false }, 
  commenters: { type: Array }, 
  "commenters.$": { type: Id, required: false }, 
  createdAt: { type: Integer }, 
  author: { type: String }, 
  createdBy: { type: Id }, 
  rating: { type: Number },   
}, { requiredByDefault: developmentValidationEnabledFalse });

Redflags.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
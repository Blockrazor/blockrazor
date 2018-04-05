import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Features = new Mongo.Collection('features');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Features.schema = new SimpleSchema({
  _id: { type: Id }, 
  currencyId: { type: Id }, 
  featureName: { type: String },
  appeal: { type: Integer },
  appealNumber: { type: Integer },
  appealVoted: { type: Array },
  "appealVoted.$": { type: Id }, 
  flags: { type: Integer },
  flagRatio: { type: Number },
  flaggedBy: { type: Array },
  "flaggedBy.$": { type: Id }, 
  commenters: { type: Array },
  "commenters.$": { type: Id }, 
  createdAt: { type: Integer },
  author: { type: String },
  createdBy: { type: Id }, 
  rating: { type: Integer },
  currencySlug: { type: String },
}, { requiredByDefault: developmentValidationEnabledFalse });

Features.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
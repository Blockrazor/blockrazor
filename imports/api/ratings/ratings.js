import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Ratings = new Mongo.Collection('ratings');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Ratings.schema = new SimpleSchema({
  _id: { type: Id }, 
  owner: { type: Id }, 
  currency0Id: { type: Id }, 
  currency1Id: { type: Id }, 
  winner: { type: Id }, 
  loser: { type: Id }, 
  currency0approved: { type: Boolean }, 
  currency1approved: { type: Boolean }, 
  questionId: { type: String },  
  questionText: { type: String }, 
  createdAt: { type: Integer }, 
  processedAt: { type: Integer }, 
  processed: { type: Boolean }, 
  catagory: { type: String }, 
  type: { type: String }, 
  answeredAt: { type: Integer }, 
  answered: { type: Boolean }, 
}, { requiredByDefault: developmentValidationEnabledFalse });

Ratings.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
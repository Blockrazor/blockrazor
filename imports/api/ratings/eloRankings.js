import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const EloRankings = new Mongo.Collection('elorankings');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

EloRankings.schema = new SimpleSchema({
  _id: { type: Id }, 
  currencyName: { type: String }, 
  currencyId: { type: Id }, 
  question: { type: String }, 
  questionId: { type: Integer }, 
  ranking: { type: Integer },
}, { requiredByDefault: developmentValidationEnabledFalse });

EloRankings.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});

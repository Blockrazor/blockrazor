import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const HashAverage = new Mongo.Collection('hashaverage')

var { Integer, RegEx } = SimpleSchema
var { Id, Domain } = RegEx

HashAverage.schema = new SimpleSchema({
  _id: { type: Id },
  algorithm: { type: Id },
  average: { type: Number }
}, { requiredByDefault: developmentValidationEnabledFalse });

HashAverage.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
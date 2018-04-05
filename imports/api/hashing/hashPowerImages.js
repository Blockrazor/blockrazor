import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const HashPowerImages = new Mongo.Collection('hashpowerimages')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

HashPowerImages.schema = new SimpleSchema({
  _id: { type: Id }, 
  createdAt: { type: Integer },
  createdBy: { type: Id },
  extension: { type: String }
}, { requiredByDefault: developmentValidationEnabledFalse });

HashPowerImages.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
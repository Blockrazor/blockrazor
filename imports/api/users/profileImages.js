import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const ProfileImages = new Mongo.Collection('profileimages')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

ProfileImages.schema = new SimpleSchema({
  _id: { type: Id }, 
  createdAt: { type: Integer }, 
  createdBy: { type: Id }, 
  extension: { type: String }, 
}, { requiredByDefault: developmentValidationEnabledFalse });

ProfileImages.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
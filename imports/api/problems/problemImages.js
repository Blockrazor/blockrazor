import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const ProblemImages = new Mongo.Collection('problemImages')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

ProblemImages.schema = new SimpleSchema({
	_id: { type: Id },
  createdAt: { type: Integer },
  createdBy: { type: Id },
  extension: { type: String, allowedValues: ['jpeg', 'png']}
}, { requiredByDefault: developmentValidationEnabledFalse });

ProblemImages.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
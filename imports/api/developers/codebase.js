import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse, Communities } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const Codebase = new Mongo.Collection('codebase')

Codebase.schema = new SimpleSchema(Communities.schema, { requiredByDefault: developmentValidationEnabledFalse });

Codebase.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
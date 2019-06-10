import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { developmentValidationEnabledFalse } from '../indexDB'

const UserPerf = new Mongo.Collection('userPerf');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

UserPerf.schema = new SimpleSchema({
  _id: { type: Id }, 
  userId: { type: Id},
  likedCoin: { type: Array },
  "likedCoin.$": { type: Id }, 
  dislikedCoin: { type: Array },
  "dislikedCoin.$": { type: Id }, 
}, { requiredByDefault: developmentValidationEnabledFalse });


UserPerf.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
  });
export { UserPerf }
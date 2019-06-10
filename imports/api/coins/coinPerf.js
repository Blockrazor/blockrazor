import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';
import { developmentValidationEnabledFalse } from '../indexDB'

const CoinPerf = new Mongo.Collection('coinPerf');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

CoinPerf.schema = new SimpleSchema({
  _id: { type: Id }, 
  currencyId: { type: Id},
  appeal: { type: Integer },
  appealNumber: { type: Integer },
  appealVoted: { type: Array },
  "appealVoted.$": { type: Id }, 
  downVoted: { type: Array },
  "downVoted.$": { type: Id }, 
}, { requiredByDefault: developmentValidationEnabledFalse });


CoinPerf.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
  });

export { CoinPerf }
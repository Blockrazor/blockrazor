import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse, Currencies } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const PendingCurrencies = new Mongo.Collection('pendingcurrencies');

var { Integer, RegEx, oneOf } = SimpleSchema
var { Id, Domain } = RegEx

PendingCurrencies.schema = new SimpleSchema(
  Currencies.schema.omit('approvedBy', 'approvedTime', 'friendlySlugs', 
  'slug', 'eloRanking', 'codebaseRanking', 'decentralizationRanking', 'walletRanking', 'communityRanking', 'gitCommits', 'gitUpdate')
  , { requiredByDefault: developmentValidationEnabledFalse });


PendingCurrencies.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});

import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse, Currencies } from '../indexDB'
import SimpleSchema from 'simpl-schema';
import { LocalizableCollection } from "../utilities"

let Exchanges = {}

if (!Meteor.isTest) {
	Exchanges = new LocalizableCollection('exchanges', "fetchExchanges");
} else {
	Exchanges = new Mongo.Collection('exchanges')
}

export { Exchanges }

Exchanges.friendlySlugs({
  slugFrom: 'name',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
})

var { Integer, RegEx, oneOf } = SimpleSchema
var { Id, Domain } = RegEx

Exchanges.schema = new SimpleSchema({
  _id: { type: SimpleSchema.RegEx.Id },
  name: { type: String },
  currencies: { type: Array },
  "currencies.$": { type: Object },
  "currencies.$._id": { type: Id},
  'currencies.$.name': { type: String },
  'currencies.$.slug': { type: String },
  scores: { type: Integer },
  upvotes: { type: Integer },
  votes: { type: Array },
  "votes.$": { type: Object }, 
  "votes.$.userId": { type: Id }, 
  "votes.$.type": { type: String }, 
  "votes.$.loggedIP": { type: String }, 
  "votes.$.time": { type: Integer },
  removalProposed: { type: Boolean }
}, { requiredByDefault: developmentValidationEnabledFalse });

Exchanges.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
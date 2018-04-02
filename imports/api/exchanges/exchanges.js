import { Mongo } from 'meteor/mongo';
import { LocalizableCollection } from "../utilities"

let Exchanges = {}

if (!Meteor.isTest) {
	Exchanges = new LocalizableCollection('Exchanges', "fetchExchanges");
} else {
	Exchanges = new Mongo.Collection('Exchanges')
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
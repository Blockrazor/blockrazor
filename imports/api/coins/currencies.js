import { Mongo } from 'meteor/mongo';
import { LocalizableCollection } from "../utilities"

let Currencies = {}

if (!Meteor.isTest) {
	Currencies = new LocalizableCollection('currencies', "fetchCurrencies");
} else {
	Currencies = new Mongo.Collection('currencies')
}

export { Currencies }

Currencies.friendlySlugs({
  slugFrom: 'currencyName',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
})
import { Mongo } from 'meteor/mongo';

export const Currencies = new Mongo.Collection('currencies');
export const LocalCurrencies = new Mongo.Collection(null)

Currencies.friendlySlugs({
  slugFrom: 'currencyName',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
})
import { Mongo } from 'meteor/mongo';

export const Currencies = new Mongo.Collection('currencies');

Currencies.friendlySlugs({
  slugFrom: 'currencyName',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
})
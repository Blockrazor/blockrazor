import { Mongo } from 'meteor/mongo';
import { LocalizableCollection } from "../utilities"

export const Currencies = new LocalizableCollection('currencies', "fetchCurrencies");

Currencies.friendlySlugs({
  slugFrom: 'currencyName',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
})
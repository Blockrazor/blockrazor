import { Mongo } from 'meteor/mongo';
import { LocalizableCollection } from '../utilities'
import { developmentValidationEnabledFalse, Exchanges } from '../indexDB'
import SimpleSchema from 'simpl-schema';

let Currencies = {}

if (!Meteor.isTest) {
	Currencies = new LocalizableCollection('currencies', 'fetchCurrencies')
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

var { Integer, RegEx, oneOf } = SimpleSchema
var { Id, Domain } = RegEx

//pending and rejected Currencies copy from this schema using omit
//add fields here will copy them over to those collections

Currencies.schema = new SimpleSchema({
_id: { type: Id }, 
currencyName: { type: String }, 
currencySymbol: { type: String }, 
premine: { type: Integer }, 
maxCoins: { type: Integer }, 
consensusSecurity: { type: String }, 
gitRepo: { type: Domain }, 
officialSite: { type: Domain }, 
reddit: { type: Domain }, 
blockExplorer: { type: oneOf({type: Boolean, allowedValues: [false]}, Domain) }, 
approvalNotes: { type: String }, 
currencyLogoFilename: { type: String }, 
confirmations: { type: Integer }, 
previousNames: { type: Array, required: false }, 
'previousNames.$': { type: Object }, 
'previousNames.$.tag': { type: String }, 
exchanges: { type: Array }, 
'exchanges.$': { type: Object },
'exchanges.$.name': { type: String },
'exchanges.$.slug': { type: String },
'exchanges.$._id': { type: Id },
launchTags: { type: Array },
'launchTags.$': { type: Object },
'launchTags.$.tag': { type: String }, 
blockTime: { type: Integer }, 
hashAlgorithm: { type: Id }, 
genesisTimestamp: { type: Number }, 
createdAt: { type: Number }, 
owner: { type: Id }, 
proposal: { type: Boolean }, 
altcon: { type: Boolean }, 
ico: { type: Boolean }, 
btcfork: { type: Boolean }, 
bountiesCreated: { type: Boolean }, 
approvedBy: { type: Id }, 
approvedTime: { type: Integer }, 
friendlySlugs: { type: Object, required: false },  
slug: { type: String, required: false }, 
eloRanking: { type: Number }, 
codebaseRanking: { type: Number }, 
decentralizationRanking: { type: Number }, 
walletRanking: { type: Number }, 
communityRanking: { type: Number }, 
gitCommits: { type: Integer }, 
gitUpdate: { type: Number }, 
}, { requiredByDefault: developmentValidationEnabledFalse });


Currencies.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});



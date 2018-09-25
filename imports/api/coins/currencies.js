import {
  Mongo
} from 'meteor/mongo';
import {
  LocalizableCollection
} from '../utilities'
import {
  developmentValidationEnabledFalse
} from '../indexDB'
import SimpleSchema from 'simpl-schema';

let Currencies = {}

if (!Meteor.isTest) {
  Currencies = new LocalizableCollection('currencies', 'fetchCurrencies');
} else {
  Currencies = new Mongo.Collection('currencies')
}

export {
  Currencies
}

Currencies.friendlySlugs({
  slugFrom: 'currencyName',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{
    from: 'ü',
    to: 'u'
  }, {
    from: 'õö',
    to: 'o'
  }]
})

var {
  Integer,
  RegEx,
  oneOf
} = SimpleSchema
var {
  Id,
  Domain
} = RegEx

function nullValidator() {
  if (this.value === null || this.value === "") return SimpleSchema.ErrorTypes.REQUIRED
}

Currencies.schemaFuncs = {
  //if this is normal altcoin that already exists returns true for required field for relevant fields
  ifAltCoinExisting() {
    if (this.field("altcoin").value && !this.field("proposal").value) {
      return nullValidator.call(this)
    }
    return null
  },
  ifAltCoinWTV() {
    //original code that did these conditional checks
    //   //If the coin exists, no matter what it is //doesn't make sense
    //   if (altcoin && proposal) {
    //     checkSanity(data.genesisTimestamp, "intendedLaunch", "number", 13, 16); //didn't exist in first schema
    //     if (data.genesisTimestamp < 1509032068000) {
    //         error.push("genesisTimestamp");
    //         allowed = allowed.filter(function (i) {
    //             return i != "genesisTimestamp"
    //         })
    //     }
    // }
    if (this.field("altcoin").value && this.field("proposal").value) {
      return nullValidator.call(this)
    }
    return null
  },
  //If this is an ICO (launched or not)
  ifICO() {
    if (this.field("ico").value) {
      return nullValidator.call(this)
    }
    return null
  },
  //If this is an ICO that hasnt launched yet
  ifICOUnlaunched() {
    if (this.field("ico").value && this.field("proposal").value) {
      return nullValidator.call(this)
    }
    return null
  },
  //If this is a bitcoin fork (planned or existing)
  ifbtcfork() {
    if (this.field("btcfork").value) {
      return nullValidator.call(this)
    }
    return null
  },
 //If this is a smartContract
  ifSmartContract() {
    if (this.field("smartContract").value) {
      return nullValidator.call(this)
    }
    return null
  },
  //If this is not proposal
  ifNotProposal() {
    if (this.field("proposal").value) {
      return nullValidator.call(this)
    }
    return null
  },
  //parses checkboxes array to determine checked values
  launchTagsAuto() {
    const fieldKeysToValues = {
      altcoin: "Altcoin",
      proposal: "proposal",
      smartContract: "Smart Contract",
      btcfork: "Bitcoin Fork",
      ico: "ICO"
    }
    const currField = fieldKeysToValues[this.key]
    return !!this.field("launchTags").value.filter(x => x.tag == currField).length
  },
  //invalidates if value is defaultVal of dropdown that is self-populating
  checkForDropdown(defaultVal) {
      if (this.value == defaultVal) {
        return SimpleSchema.ErrorTypes.REQUIRED
      }
  },
}

//max is suppose to be an actuall digit ceiling rather than length of num
function maxNum(x) {
  return Number("9".repeat(x))
}

function minNum(x) {
  return "1" + Number("0".repeat(x - 1))
}

//pending and rejected Currencies copy from this schema using omit so that
//added fields here will copy them over to those collections
//patterened after addCoin method
Currencies.schema = new SimpleSchema({
  _id: {
    type: Id
  },
  currencyName: {
    type: String,
    min: 3,
    max: 20,
  }, //unique
  currencySymbol: {
    type: String,
    min: 2,
    max: 5,
    autoValue(){
      if (!this.isSet) return;
      return this.value.toUpperCase()
    },
  }, //uppercase
  proposal: {
    type: Boolean,
  }, //
  altcoin: {
    type: Boolean,
  }, //
  ico: {
    type: Boolean,
  }, //icocurrency n?
  btcfork: {
    type: Boolean,
  }, //if not fork then altcoin?
  smartContract: {
    type: Boolean,
  }, //if not smartContract
  premine: {
    type: Number,
    min: 0,
    max: maxNum(15),
    defaultValue: 0,
    custom(){
      //applicability undefined, error string if applicable, null otherwise
      var applicability = Currencies.schemaFuncs.ifICO.call(this)
      if (applicability !== null && this.value < this.field("ICOcoinsProduced").value){
        return "Premine lower then produced"
      }
      applicability = Currencies.schemaFuncs.ifAltCoinWTV.call(this)
      if (applicability !== null && this.value < this.field("ICOcoinsProduced").value + this.field("ICOcoinsIntended").value){
        return "Premine lower then produced and intended"
      }
    }
  }, //
  maxCoins: {
    type: Integer,
    min: 1000,
    max: maxNum(18),
    defaultValue: 0,
  }, //
  consensusSecurity: {
    type: String,
    min: 6,
    max: 20,
  }, //
  gitRepo: {
    type: Domain,
    min: 18,
    max: 300,
    required: false,
  }, //
  officialSite: {
    type: Domain,
    min: 6,
    max: 200,
    required: false,
  }, //
  reddit: {
    type: Domain,
    min: 12,
    max: 300,
    required: false,
  }, //n
  smartContractURL: {
    type: Domain,
    min: 12,
    max: 300,
    custom() {
      return Currencies.schemaFuncs.ifSmartContract.call(this)
    },
  }, //n
  blockExplorer: {
    type: Domain,
    min: 6,
    max: 300,
    required: false,
  }, //n
  approvalNotes: {
    type: String,
    required: false,
  }, //n for insert, required for edit?
  currencyLogoFilename: {
    type: String,
    min: 1,
    max: 300,
  }, //req
  confirmations: {
    type: Integer,
    min: 0,
    max: maxNum(4),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifNotProposal.call(this)
    },
  }, //n
  previousNames: {
    type: Array,
    minCount: 0,
    maxCount: 5,
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifAltCoinExisting.call(this)
    },
  }, //n,
  'previousNames.$': {
    type: Object
  },
  'previousNames.$.tag': {
    type: String
  },
  exchanges: {
    type: Array,
    minCount: 0,
    maxCount: 15,
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifNotProposal.call(this)
    },
  }, //n
  'exchanges.$': {
    type: Object
  },
  'exchanges.$.name': {
    type: String
  },
  'exchanges.$.slug': {
    type: String
  },
  'exchanges.$._id': {
    type: Id
  },
  relatedRepos: {
    type: Array,
    optional: true
  },
  'relatedRepos.$': {
    type: Object
  },
  'relatedRepos.$.id': {
    type: String
  },
  'relatedRepos.$.name': {
    type: String
  },
  'relatedRepos.$.html_url': {
    type: String
  },
  'relatedRepos.$.fork': {
    type: String
  },
  'relatedRepos.$.created_at': {
    type: String
  },
  'relatedRepos.$.updated_at': {
    type: String
  },
  'relatedRepos.$.stargazers_count': {
    type: String
  },
  'relatedRepos.$.watchers_count': {
    type: String
  },
  'relatedRepos.$.language': {
    type: String
  },
  'relatedRepos.$.forks_count': {
    type: String
  },
  'relatedRepos.$.score': {
    type: Number
  },
  gitStats: {
    type: Object,
    optional: true
  },
  'gitStats.related': {
    type: Number
  },
  'gitStats.watchers': {
    type: Number
  },
  'gitStats.likes': {
    type: Number
  },
  'gitStats.avgWatchers': {
    type: Number
  },
  'gitStats.topLanguages': {
    type: Array
  },
  'gitStats.topLanguages.$': {
    type: String
  },
  launchTags: {
    type: Array,
    minCount: 1,
    maxCount: 3,
  }, //
  'launchTags.$': {
    type: Object
  },
  'launchTags.$.tag': {
    type: String
  },
  blockTime: {
    type: Integer,
    min: 0,
    max: maxNum(4),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifNotProposal.call(this)
    },
  }, //n
  forkHeight: {
    type: Integer,
    min: minNum(6),
    max: maxNum(6),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifbtcfork.call(this)
    },
  }, //n
  forkParent: {
    type: String,
    min: 6,
    max: 20,
    required: false,
    custom() {
      const a = Currencies.schemaFuncs.checkForDropdown.call(this, "-Select Fork Parent-")
      const b = Currencies.schemaFuncs.ifbtcfork.call(this)
      return a || b
    }
  }, //
  replayProtection: {
    type: String,
    min: 4,
    max: 5,
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifbtcfork.call(this)
    }
  }, //???
  hashAlgorithm: {
    type: Id,
  }, //n, null allowed yet checkForDrpdown
  ICOfundsRaised: {
    type: Integer,
    min: 1,
    max: maxNum(15),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifICO.call(this)
    },
  }, //
  genesisTimestamp: {
    type: Number,
    min: minNum(13),
    max: maxNum(16),
    required: false,
    custom() {
      // SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED
      //returns null if not applicable, undefined if applicable and passing, err otherwise
      var res = Currencies.schemaFuncs.ifAltCoinExisting.call(this)
      //condition for AltCoinExisting
      if (res !== null){
        res = this.value < 1231006505000? SimpleSchema.ErrorTypes.MIN_NUMBER : null
      } else {
        res = Currencies.schemaFuncs.ifAltCoinWTV.call(this)
        if (res !== null){
          res = this.value < 1509032068000? SimpleSchema.ErrorTypes.MIN_NUMBER : null
        }
      }
      return res
    },
  },
  createdAt: {
    type: Number
  },
  owner: {
    type: Id
  },
  icocurrency: {
    type: String,
    min: 3,
    max: 3,
    required: false,
    custom() {
      const a = Currencies.schemaFuncs.ifICO.call(this)
      const b = Currencies.schemaFuncs.checkForDropdown.call(this, "----")
      return a || b
    },
  },
  ICOcoinsProduced: {
    type: Integer,
    min: 0,
    max: maxNum(15),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifICO.call(this)
    },
  }, //n
  ICOcoinsIntended: {
    type: Integer,
    min: 0,
    max: maxNum(15),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifICOUnlaunched.call(this)
    },
  }, //n
  ICOnextRound: {
    type: Integer,
    min: minNum(13),
    max: maxNum(16),
    required: false,
    // autoValue: 
    custom() {
      return Currencies.schemaFuncs.ifICOUnlaunched.call(this)
    },
  }, //
  icoDateEnd: {
    type: Integer,
    min: minNum(13),
    max: maxNum(16),
    required: false,
    custom() {
      return Currencies.schemaFuncs.ifICOUnlaunched.call(this)
    },
  }, //
  // intendedLaunch: { type: Number, min: minNum(13), max: maxNum(16), required: ifAltCoinWtv, }, //is actually derived from genesisTimestamp intended as duplicate field
  bountiesCreated: {
    type: Boolean
  },
  approvedBy: {
    type: Id
  },
  approvedTime: {
    type: Integer
  },
  friendlySlugs: {
    type: Object,
    required: false
  },
  slug: {
    type: String,
    required: false
  },
  eloRanking: {
    type: Number
  },
  codebaseRanking: {
    type: Number
  },
  decentralizationRanking: {
    type: Number
  },
  walletRanking: {
    type: Number
  },
  communityRanking: {
    type: Number
  },
  gitCommits: {
    type: Integer
  },
  gitUpdate: {
    type: Number
  },
}, {
  requiredByDefault: developmentValidationEnabledFalse
});


Currencies.deny({
  insert() {
    return true;
  },
  update() {
    return true;
  },
  remove() {
    return true;
  },
});
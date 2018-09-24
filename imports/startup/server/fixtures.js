import { Mongo } from 'meteor/mongo';
import { FormData } from '/imports/api/indexDB.js'
import { Bounties, Auctions, Exchanges } from '/imports/api/indexDB.js'

// In order to easily populate the database with required Bounties, we upsert them on startup. This code can be removed later on...
Meteor.startup(() => {
  [{
      "_id" : "new-currency", 
      "problem" : "Blockrazor needs new currencies", 
      "solution" : "Add a new currency now", 
      "types" : {
          "heading" : "Add a new currency", 
          "rules" : "If you accept this bounty, you'll have 60 minutes to complete it and add a new currency for the given reward. If the bounty expires, you'll still be credited, but the reward is not guaranteed after 60 minutes."
      }, 
      "multiplier" : 1.8, 
      "currentlyAvailable" : true, 
      "currencyName" : "Blockrazor", 
      "pendingApproval" : false, 
      "url" : "/addCoin", 
      "time" : 3600000.0
  },
  { 
      "_id" : "new-hashpower", 
      "problem" : "Blockrazor needs new hash power data", 
      "solution" : "Add new hash power data now", 
      "types" : {
          "heading" : "Add new hash power data", 
          "rules" : "If you accept this bounty, you'll have 30 minutes to complete it and add new hash power data for the given reward. If the bounty expires, you'll still be credited, but the reward is not guaranteed after 30 minutes."
      }, 
      "multiplier" : 0.9, 
      "currentlyAvailable" : true, 
      "currencyName" : "Blockrazor", 
      "pendingApproval" : false, 
      "url" : "/add-hashpower", 
      "time" : 1800000.0
  },
  { 
      "_id" : "new-wallet", 
      "problem" : "Blockrazor needs new wallet ratings", 
      "solution" : "Add some wallets and answer some questions right now", 
      "types" : {
          "heading" : "Rate cryptocurrency wallets", 
          "rules" : "If you accept this bounty, you'll have 60 minutes to complete it and answer questions for the given reward. The reward will be multiplied by the amount of questions you answer. If the bounty expires, you'll still be credited, but the reward is not guaranteed after 60 minutes."
      }, 
      "multiplier" : 0.3, 
      "currentlyAvailable" : true, 
      "currencyName" : "Blockrazor", 
      "pendingApproval" : false, 
      "url" : "/ratings", 
      "time" : 3600000.0
  },
  { 
      "_id" : "new-codebase", 
      "problem" : "Blockrazor needs new codebase ratings", 
      "solution" : "Add some codebases and answer some questions right now", 
      "types" : {
          "heading" : "Rate cryptocurrency codebases", 
          "rules" : "If you accept this bounty, you'll have 60 minutes to complete it and answer questions for the given reward. The reward will be multiplied by the amount of questions you answer. If the bounty expires, you'll still be credited, but the reward is not guaranteed after 60 minutes."
      }, 
      "multiplier" : 0.3, 
      "currentlyAvailable" : true, 
      "currencyName" : "Blockrazor", 
      "pendingApproval" : false, 
      "url" : "/codebase", 
      "time" : 3600000.0
  },
  { 
      "_id" : "new-community", 
      "problem" : "Blockrazor needs new community ratings", 
      "solution" : "Add some communities and answer some questions right now", 
      "types" : {
          "heading" : "Rate cryptocurrency communities", 
          "rules" : "If you accept this bounty, you'll have 60 minutes to complete it and answer questions for the given reward. The reward will be multiplied by the amount of questions you answer. If the bounty expires, you'll still be credited, but the reward is not guaranteed after 60 minutes."
      }, 
      "multiplier" : 0.3, 
      "currentlyAvailable" : true, 
      "currencyName" : "Blockrazor", 
      "pendingApproval" : false, 
      "url" : "/communities", 
      "time" : 3600000.0
  }].forEach(i => Bounties.upsert({
      _id: i._id
  }, {
      $set: i
  }))
})

Auctions.upsert({
  _id: 'top-currency'
}, {
  $set: {
    name: 'Top currency auction',
    description: 'Bid a certain amount of KZR to keep your favorite cryptocurrency on top.'
  }
})

if (FormData.find().count() === 0) {
  [{
        name: 'Proof of Work',
        subsecurity: [
          { name: 'SHA-256' },
          { name: 'Scrypt' },
          { name: 'X11' },
          { name: 'Quark' },
          { name: 'Groestl' },
          { name: 'Blake-256' },
          { name: 'NeoScrypt' },
          { name: 'Lyra2REv2' },
          { name: 'CryptoNight' },
          { name: 'EtHash' },
          { name: 'Equihash' },
          { name: 'Cuckoo16' },
          { name: 'Cuckoo30' },
        ],
      },
      {
        name: 'Proof of Stake',
      },
      {
        name: 'Hybrid',
        subsecurity: [
        { name: 'Staking and SHA-256' },
        { name: 'Staking and Scrypt' },
        { name: 'Staking and X11' },
        { name: 'Staking and Quark' },
        { name: 'Staking and Groestl' },
        { name: 'Staking and Blake-256' },
        { name: 'Staking and NeoScrypt' },
        { name: 'Staking and Lyra2REv2' },
        { name: 'Staking and CryptoNight' },
        { name: 'Staking and EtHash' },
        { name: 'Staking and Equihash' },
        { name: 'Staking and Cuckoo16' },
        { name: 'Staking and Cuckoo30' },
        ],
      },
      {
        name: 'Proof of Vitalik',
      },].forEach(doc => {FormData.insert(doc)})
};

Meteor.call('activityIPFixture', (err, data) => {})
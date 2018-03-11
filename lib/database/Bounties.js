import { Mongo } from 'meteor/mongo';
if(Meteor.isServer) {
  import { log } from '../../server/main'
}

import { Bounties, BountyTypes, Currencies } from '/imports/api/indexDB.js'

//THIS FILE WAS REPLICATED IN .../API/UTILITIES

//inserted into methods
export var REWARDCOEFFICIENT = 60000000;

export var createtypes = function(){
  BountyTypes.insert({
    type: "HashrateAPI",
    locktime: 60,
    rules: "After clicking start, you will have 30 minutes to complete this bounty. You need to: [1] find a block explorer or open node which can provide the current network hash rate, [2] construct an API call to get the current hash rate, and [3] tell Blockrazor how to consume the response so that the final result is an integer.",
    heading: "Find and provide API call details"
  })
}

// inserted it into appropriate method
// export var cancelBounty = function(bountyId, userId) { 
//   import { UserData } from './UserData.js'; 
//   Bounties.upsert(bountyId, { 
//     $set: { 
//       currentUsername: null, 
//       expiresAt: null, 
//       currentlyAvailable: true 
//     } 
//   }); 
//   UserData.upsert(userId, { 
//     $set: { 
//       workingOnBounty: false 
//     } 
//   }); 
// } 

export var fetchHashrate = function(id) {
  HTTP.get(Bounties.findOne({_id: id}).APICall, (error, response) => { //Bounties.findOne({_id: id}).APICall
    if(!error) {
      data = JSON.parse(response.content);
      var returnedBlockReward = null;
      var returnedEmissions = null;
      if (Bounties.findOne({_id: id}).BlockReward && Bounties.findOne({_id: id}).AtomicUnitFactor) {
        returnedBlockReward = eval(Bounties.findOne({_id: id}).BlockReward) / Bounties.findOne({_id: id}).AtomicUnitFactor;
      };
      if (Bounties.findOne({_id: id}).Emissions && Bounties.findOne({_id: id}).AtomicUnitFactor) {
        returnedEmissions = eval(Bounties.findOne({_id: id}).Emissions) / Bounties.findOne({_id: id}).AtomicUnitFactor;
      }
      Bounties.upsert(id, {
        $set: {
          returnedHashrate: eval(Bounties.findOne({_id: id}).Hashrate),
          returnedBlockReward: (returnedBlockReward ? returnedBlockReward : false),
          returnedEmissions: (returnedEmissions ? Math.round(returnedEmissions) : false),
          returnedHeight: (Bounties.findOne({_id: id}).Height ? eval(Bounties.findOne({_id: id}).Height) : false),
          returnedTimestamp: (Bounties.findOne({_id: id}).Timestamp ? eval(Bounties.findOne({_id: id}).Timestamp) : false),
          pendingApproval: true
        }
      });
    } else {
      log.error('Error in fetchHashrate', error)
    }
  });
}


export var generateBounties = function () {
  if (Meteor.isServer) {
    var noAPIBounty = Currencies.find({bountiesCreated: false, proposal: false, consensusSecurity: "Proof of Work"}).fetch();
    for (i in noAPIBounty) {
      var hashrateUnits = null;
      switch(noAPIBounty[i].hashAlgorithm) {
        default: hashrateUnits = "H/s";
        case "SHA-256": hashrateUnits = "H/s"; break;
        case "Scrypt": hashrateUnits = "H/s"; break;
        case "X11": hashrateUnits = "H/s"; break;
        case "Quark": hashrateUnits = "H/s"; break;
        case "Groestl": hashrateUnits = "H/s"; break;
        case "Blake-256": hashrateUnits = "H/s"; break;
        case "NeoScrypt": hashrateUnits = "H/s"; break;
        case "Lyra2REv2": hashrateUnits = "H/s"; break;
        case "CryptoNight": hashrateUnits = "H/s"; break;
        case "EtHash": hashrateUnits = "H/s"; break;
        case "Equihash": hashrateUnits = "S/s"; break;
        case "Cuckoo16": hashrateUnits = "C/s"; break;
        case "Cuckoo30": hashrateUnits = "C/s"; break;

      }
      Bounties.insert({
        currencyId: noAPIBounty[i]._id,
        currencyName: noAPIBounty[i].currencyName,
        currentlyAvailable: true,
        currentUsername: null,
        currentStartTime: null,
        bountyType: "HashrateAPI",
        creationTime: Date.now(),
        problem: "Blockrazor doesn't know how to get the current network hash power for " + noAPIBounty[i].currencyName,
        solution: "find a block explorer or open node and provide the API call (and the response object details) so that Blockrazor can keep itself updated with the current hash power for " + noAPIBounty[i].currencyName,
        pendingApproval: false,
        completedBy: null,
        APICall: null,
        Hashrate: null,
        hashrateUnits: hashrateUnits,
        Height: null,
        Timestamp: null,
        BlockReward: null,
        Emissions: null,
        AtomicUnitFactor: null
      });
      Currencies.upsert(noAPIBounty[i]._id, {
        $set: {
          bountiesCreated: true
        }
      })
    }

  };
}
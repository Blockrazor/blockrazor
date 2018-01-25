import { Mongo } from 'meteor/mongo';
if(Meteor.isServer) {
  import { log } from '../../server/main'
}
export var Bounties = new Mongo.Collection('bounties');
export var BountyTypes = new Mongo.Collection('bountytypes');
export var REWARDCOEFFICIENT = 60000000;

export var createtypes = function(){
  BountyTypes.insert({
    type: "HashrateAPI",
    locktime: 60,
    rules: "After clicking start, you will have 30 minutes to complete this bounty. You need to: [1] find a block explorer or open node which can provide the current network hash rate, [2] construct an API call to get the current hash rate, and [3] tell Blockrazor how to consume the response so that the final result is an integer.",
    heading: "Find and provide API call details"
  })
}

export var cancelBounty = function(bountyId, userId) {
  import { UserData } from './UserData.js';
  Bounties.upsert(bountyId, {
    $set: {
      currentUsername: null,
      expiresAt: null,
      currentlyAvailable: true
    }
  });
  UserData.upsert(userId, {
    $set: {
      workingOnBounty: false
    }
  });
}

if(Meteor.isServer) {
  import { UserData } from './UserData.js';
  import { APICalls } from '../../server/serverdb/APICalls.js';
  import { sendMessage } from './ActivityLog.js';
  import { creditUserWith } from '../../server/serverdb/rewards.js';
  Meteor.methods({
    rejectBounty: function(bountyId, reason) {
      if(UserData.findOne({_id: this.userId}).moderator) {
        var original = Bounties.findOne({_id: bountyId});
        Bounties.upsert(bountyId, {
          $set: {
            approved: false,
            pendingApproval: false,
            rejectedReason: reason,
            rejected: true,
            rejectedBy: Meteor.user().username
          }
        });
        sendMessage(original.completedBy, ("The " + original.bountyType + " bounty you submitted for " + original.currencyName + "has been denied by a moderator. Please see your Pending list to see more details."))
      }
    },
    approveAPIbounty: function(bountyId) {
      if(UserData.findOne({_id: this.userId}).moderator) {
        var original = Bounties.findOne({_id: bountyId});
        if (original.completedBy == this.userId) {
          throw new Meteor.Error("Approving your own bounty is no fun!")
        }
        Bounties.upsert(bountyId, {
          $set: {
            approved: true,
            pendingApproval: false,
            approvedBy: this.userId,
            approvedTime: new Date().getTime()
          }
        });

        if(original.bountyType == "HashrateAPI") {
          APICalls.insert({
            currencyid: original.currencyId,
            currencyName: original.currencyName,
            callType: "Hashrate",
            createdAt: Date.now(),
            APICall: original.APICall,
            Hashrate: original.Hashrate,
            Height: original.Height,
            BlockReward: original.BlockReward,
            Emissions: original.Emissions,
            Timestamp: original.Timestamp,
            AtomicUnitFactor: original.AtomicUnitFactor,
            hashrateUnits: original.hashrateUnits,
            createdBy: original.completedBy,
            approvedBy: original.approvedBy
          }, function(error, result){
          })
        }
        creditUserWith(original.bountyReward, original.completedBy, ("completing the " + original.currencyName + " " + original.bountyType + "."));
        sendMessage(original.completedBy, ("I have approved your bounty for " + original.currencyName), Meteor.user().username);
      }
    },
    completeAPIbounty: function(apiData){
      if(Meteor.user().username == Bounties.findOne({_id: apiData.bountyId}).currentUsername) {
        console.log("1");
        if(Date.now() < Bounties.findOne({_id: apiData.bountyId}).expiresAt) {
          console.log("2");
          Bounties.upsert(apiData.bountyId, {
            $set: {
              APICall: apiData.apiCall,
              Hashrate: apiData.hashrate,
              Height: (apiData.height ? apiData.height : null),
              Timestamp: (apiData.timestamp ? apiData.timestamp : null),
              BlockReward: (apiData.reward ? apiData.reward : null),
              Emissions: (apiData.emissions ? apiData.emissions : null),
              AtomicUnitFactor: (apiData.decimal ? apiData.decimal : null),
              pendingApproval: false,
              completedBy: Meteor.userId(),
              completedTime: Date.now(),
              bountyReward: ((Date.now() - Bounties.findOne({_id: apiData.bountyId}).creationTime) / REWARDCOEFFICIENT).toFixed(6)
            }
          }, false, function(error, result) {
            if(error) {
              throw new Meteor.Error('Error submitting data', error)
            }
          })
          fetchHashrate(apiData.bountyId);
        } else { throw new Meteor.Error('Error submitting data')}
      } else { throw new Meteor.Error('Error submitting data')}
    },
    cancelBounty: function(id) {
      if(Bounties.findOne({_id: id}).currentUsername == Meteor.user().username) {
        cancelBounty(id, Meteor.userId());
      }
    },
    startBounty: function(id){
      if(Bounties.findOne({_id: id}).currentlyAvailable == true) {
      if(Meteor.user() && !UserData.findOne({_id: this.userId}).workingOnBounty) {
      Bounties.upsert(id, {
        $set: {
          currentUsername: Meteor.user().username,
          expiresAt: Date.now() + 3600000,
          currentlyAvailable: false
        }
      }) //end Bounties upsert
      UserData.upsert(Meteor.userId(), {
        $set: {
          workingOnBounty: true
        }
      })// End UserData upsert
  }} else {throw new Meteor.Error('startBounty method error', 'Cannot start bounty')}
} //end startBounty
  }); //end methods

  Meteor.publish('bounties', function(id) {
    if(!id) {
      return Bounties.find();
    } else {
      return Bounties.find({_id: id, currentUsername: Meteor.user().username});
    }
  });
  Meteor.publish('bountytypes', function(type) {
    if(!type) {
      return BountyTypes.find();
    } else {
      return BountyTypes.find({type: type});
    }
  })

}

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
    import { Currencies } from './Currencies.js';
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
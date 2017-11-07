import { Mongo } from 'meteor/mongo';
export var Bounties = new Mongo.Collection('bounties');
export var BountyTypes = new Mongo.Collection('bountytypes');

export var createtypes = function(){
  BountyTypes.insert({
    type: "HashrateAPI",
    locktime: 60,
    rules: "After clicking start, you will have 30 minutes to complete this bounty. You need to: [1] find a block explorer or open node which can provide the current network hash rate, [2] construct an API call to get the current hash rate, and [3] tell Blockrazor how to consume the response so that the final result is an integer.",
    heading: "Find and provide API call details"
  })
}

if(Meteor.isServer) {
  import { UserData } from '../../server/serverdb/UserData.js';
  Meteor.methods({
    startBounty: function(id){
      if(Meteor.user()) {
      Bounties.upsert(id, {
        $set: {
          currentUsername: Meteor.user().username,
          expiresAt: Date.now() + 3600000,
          currentlyAvailable: false
        }
      }) //end Bounties upsert

  }
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



export var generateBounties = function () {
  if (Meteor.isServer) {
    import { Currencies } from './Currencies.js';
    var noBounty = Currencies.find({bountiesCreated: false}).fetch();
    for (i in noBounty) {
      Bounties.insert({
        currencyId: noBounty[i]._id,
        currencyName: noBounty[i].currencyName,
        currentlyAvailable: true,
        currentUsername: null,
        currentStartTime: null,
        bountyType: "HashrateAPI",
        creationTime: Date.now(),
        problem: "Blockrazor doesn't know how to get the current network hash power for " + noBounty[i].currencyName,
        solution: "find a block explorer or open node and provide the API call (and the response object details) so that Blockrazor can keep itself updated with the current hash power for " + noBounty[i].currencyName,
        pendingApproval: false,
        completedBy: null,
        APICall: null,
        Hashrate: null,
        Height: null,
        Timestamp: null,
        BlockReward: null,
        Emissions: null,
        AtomicUnitFactor: null
      });
      Currencies.upsert(noBounty[i]._id, {
        $set: {
          bountiesCreated: true
        }
      })
    }

  };
}

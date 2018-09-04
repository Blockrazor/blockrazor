import { Meteor } from 'meteor/meteor'
import { UserData, Bounties, REWARDCOEFFICIENT } from '/imports/api/indexDB.js';
import { creditUserWith } from '/imports/api/utilities.js';
import { sendMessage } from '/imports/api/activityLog/methods'
if (Meteor.isServer){
  import { APICalls } from '/server/serverdb/APICalls.js';
} else {
  let APICalls = {insert(){}}
}

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
  addNewBounty: (type, reward, time) => {
    if (Meteor.userId()) {
      let b = Bounties.find({
        userId: Meteor.userId(),
        type: type,
        completed: false
      }, {
        sort: {
          expiresAt: -1
        }
      }).fetch()[0]

      if (!(b && b.expiresAt > Date.now())) {
        if (b) { // remove the expired one
          Bounties.remove({
            _id: b._id
          })
        }

        Bounties.insert({
          _id: Random.id(16),
          userId: Meteor.userId(),
          currentUsername: Meteor.user().username,
          type: type,
          expiresAt: Date.now() + time,
          currentlyAvailable: false,
          currentReward: reward,
          completed: false,
          pendingApproval: true
        })
      } else {
        throw new Meteor.Error('messages.bounties.already_working')
      }
    }
  },
  extendBounty: (currency) => {
    if (Meteor.userId()) {
      let b = Bounties.find({
        type: `currency-${currency}`
      }, {
        sort: {
          expiresAt: -1
        }
      }).fetch()[0]

      if (b && b.expiresAt > Date.now() && b.type.startsWith('currency-')) { // you can only extend if it's not already expired, and it's only for currency hash power api bounties
        Bounties.update({
          type: `currency-${currency}`
        }, {
          $inc: {
            expiresAt: 3600000.0 // extend by one hour
          }
        })
      } else {
        throw new Meteor.Error('messages.bounties.invalid_bounty')
      }
    }
  },
  saveLastData: (bountyId, date) => {
    let b = Bounties.findOne({
      _id: bountyId
    })

    if (b && ~['new-currency', 'new-hashpower', 'new-codebase', 'new-community', 'new-wallet'].indexOf(b.type)) {
      let user = Meteor.users.findOne({
        _id: b.userId
      }) || {}

      Bounties.update({
        _id: b.type
      }, {
        $set: {
          previousReward: b.currentReward,
          previousCompletedAt: date,
          currentUsername: user.username || ''
        }
      })
    }
  },
  completeNewBounty: (type, id) => {
    let b = Bounties.findOne({
      type: type,
      userId: Meteor.userId(),
      completed: false
    }, {
      sort: {
        expiresAt: -1
      }
    })

    // if bounty found
    if (b) {
      let date = Date.now()
      
      Bounties.update({
        type: type,
        userId: Meteor.userId(),
        completed: false
      }, {
        $set: {
          completed: true,
          completedAt: date,
          id: id
        }
      })
  
      Meteor.call('saveLastData', b._id, date, (err, data) => {})
    }
  },
  deleteNewBounty: (id, token) => {
    if (token === 's3rver-only')
      Bounties.remove({
        _id: id
      })
  },
  deleteNewBountyClient: (type) => {
    Bounties.remove({
      userId: Meteor.userId(),
      type: type,
      completed: false
    })
  },
  approveAPIbounty: function(bountyId) {
    if(UserData.findOne({_id: this.userId}).moderator) {
      var original = Bounties.findOne({_id: bountyId});
      if (original.completedBy == this.userId) {
        throw new Meteor.Error('messages.bounties.approving_own')
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
      creditUserWith(original.bountyReward, original.completedBy, ("completing the " + original.currencyName + " " + original.bountyType + "."),'bountyReward');
      sendMessage(original.completedBy, ("I have approved your bounty for " + original.currencyName), Meteor.user().username);
    }
  },
  completeAPIbounty: function(apiData){
    if(Meteor.user().username == Bounties.findOne({_id: apiData.bountyId}).currentUsername) {
      if(Date.now() < Bounties.findOne({_id: apiData.bountyId}).expiresAt) {
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
            throw new Meteor.Error('messages.error', error)
          }
        })
        fetchHashrate(apiData.bountyId);
      } else { throw new Meteor.Error('messages.error')}
    } else { throw new Meteor.Error('messages.error')}
  },
  cancelBounty: function(id) {
    if(Bounties.findOne({_id: id}).currentUsername == Meteor.user().username) {
      Bounties.upsert(id, {
        $set: {
          currentUsername: null,
          expiresAt: null,
          currentlyAvailable: true
        }
      });
      UserData.upsert(Meteor.userId(), {
        $set: {
          workingOnBounty: false
        }
      });
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
}} else {throw new Meteor.Error('startBounty method error', 'messages.bounties.cant_start')}
} //end startBounty
}); //end methods
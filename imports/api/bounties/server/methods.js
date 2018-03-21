import { Meteor } from 'meteor/meteor'

import { UserData, Bounties } from '/imports/api/indexDB.js';
import { APICalls } from '/server/serverdb/APICalls.js';
import { creditUserWith } from '../../utilities.js';

import {REWARDCOEFFICIENT} from '../REWARDCOEFFICIENT' //needed on client

import { sendMessage } from '/imports/api/activityLog/server/methods'

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
        Bounties.insert({
          _id: Random.id(16),
          userId: Meteor.userId(),
          type: type,
          expiresAt: Date.now() + time,
          currentlyAvailable: false,
          currentReward: reward,
          completed: false,
          pendingApproval: true
        })
      } else {
        throw new Meteor.Error('You are already working on this one.')
      }
    }
  },
  completeNewBounty: (type, id) => {
    Bounties.update({
      type: type,
      userId: Meteor.userId(),
      completed: false
    }, {
      $set: {
        completed: true,
        id: id
      }
    })
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
            throw new Meteor.Error('Error submitting data', error)
          }
        })
        fetchHashrate(apiData.bountyId);
      } else { throw new Meteor.Error('Error submitting data')}
    } else { throw new Meteor.Error('Error submitting data')}
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
}} else {throw new Meteor.Error('startBounty method error', 'Cannot start bounty')}
} //end startBounty
}); //end methods
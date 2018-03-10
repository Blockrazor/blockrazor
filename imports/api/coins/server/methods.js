import { Meteor } from 'meteor/meteor'
import { ActivityLog, Bounties, REWARDCOEFFICIENT, UserData,
  Currencies, PendingCurrencies, RejectedCurrencies, ChangedCurrencies } from '/imports/api/indexDB.js'
import { rewardCurrencyCreator } from '/imports/api/utilities.js';


Meteor.methods({
  getLastCurrency: () => Currencies.find({}, {
    sort: {
      approvedTime: -1
    }
  }).fetch()[0],
  getCurrentReward: (userId, currencyName) => {
    let bounty = Bounties.findOne({
      userId: userId,
      type: 'new-currency',
      completed: true,
      id: currencyName
    })

    console.log(bounty)

    let lastCurrency = Currencies.find({}, {
      sort: {
        approvedTime: -1
      }
    }).fetch()[0]

    let currency = Currencies.findOne({
      currencyName: currencyName
    }) || {}

    if (bounty) {
      Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {})

      if (bounty.expiresAt < currency.createdAt) {
        console.log('already expired')
        return ((Date.now() - lastCurrency.approvedTime) / REWARDCOEFFICIENT) * 1.8
      } else {
        console.log('actual bounty')
        return Number(bounty.currentReward)
      }
    } else {
      console.log('no bounty')
      return ((Date.now() - lastCurrency.approvedTime) / REWARDCOEFFICIENT) * 1.8
    }
  },
  approveCurrency: function(currencyId) {
    if(UserData.findOne({_id: this.userId}).moderator) {
        var original = PendingCurrencies.findOne({_id: currencyId});
        if (original.owner == this.userId) {
          throw new Meteor.Error("Approving your own currency is no fun!")
        }

        var insert = _.extend(original, {
          approvedBy: this.userId,
          approvedTime: new Date().getTime()
        });
        Currencies.insert(insert, function(error, result) {
          if (!error) {
            ActivityLog.insert({
              owner: original.owner,
              content: "I have approved " + original.currencyName + " and it's now listed!",
              time: new Date().getTime(),
              from: Meteor.user().username,
              type: "message"
            });
            if(rewardCurrencyCreator(original.launchTags, original.owner, original.currencyName)) {//(creditUserWith(rewardFor(getRewardTypeOf(original.launchTags, "currency"), false)), original.owner) {
              PendingCurrencies.remove(currencyId);
            }

          }
        });
    }

  },
  rejectCurrency(name, id, owner, message, moderator) {
    if(UserData.findOne({_id: this.userId}).moderator) {
    var original = PendingCurrencies.findOne({_id: id});
    var insert = _.extend(original, {
      rejectedReason: message,
      rejectedBy: moderator
    });
    RejectedCurrencies.insert(insert, function(error, result) {
      if(!error) {
        ActivityLog.insert({
          owner: owner,
          content: name + " was incomplete or incorrect and has not been approved. Please see your moderated list for more information.",
          time: new Date().getTime(),
          from: Meteor.user().username,
          type: "message"
        });
        PendingCurrencies.remove({_id: id});
      }
    })
  }},

  setRejected(id, status) {
    if(UserData.findOne({_id: this.userId}).moderator) {
    PendingCurrencies.upsert({_id: id}, {
      $set: {rejected: status}
    })
  }}
});
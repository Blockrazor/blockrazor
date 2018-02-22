import { Mongo } from 'meteor/mongo';
import { ActivityLog } from './ActivityLog.js'
import { REWARDCOEFFICIENT, Bounties } from './Bounties'


export const Currencies = new Mongo.Collection('currencies');
export const PendingCurrencies = new Mongo.Collection('pendingcurrencies');
export const RejectedCurrencies = new Mongo.Collection('rejectedcurrencies');
export const ChangedCurrencies = new Mongo.Collection('changedcurrencies');


Currencies.friendlySlugs({
  slugFrom: 'currencyName',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
})

if (Meteor.isServer) {
  import { rewardCurrencyCreator } from '../../server/serverdb/rewards.js';
  import { UserData } from '../../lib/database/UserData.js';
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
        currencyName: currencyName
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
        Meteor.call('deleteCurrencyBounty', bounty._id, 's3rver-only', (err, data) => {})

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

  //import { UserData } from '../../server/serverdb/UserData.js';
  Meteor.publish('approvedcurrencies', function currenciesPublication() {
    return Currencies.find();
  });

  // Adds the ability to subscribe only to one currency
  Meteor.publish('approvedcurrency', slug => Currencies.find({
    slug: slug
  }))

  Meteor.publish('pendingcurrencies', function pending() {
    if(UserData.findOne({_id: this.userId}).moderator) {
        return PendingCurrencies.find({});
    } else {
      return PendingCurrencies.find({owner: this.userId});
    }
  });
    Meteor.publish('changedCurrencies', function changed() {
        if (UserData.findOne({ _id: this.userId }).moderator) {
            return ChangedCurrencies.find({status: { $ne: 'merged'}});
        }
    });

  Meteor.publish('rejectedcurrencies', function rejected() {
    if(UserData.findOne({_id: this.userId}).moderator) {
        return RejectedCurrencies.find();
    } else {
      return RejectedCurrencies.find({owner: this.userId});
    }
  });
  }

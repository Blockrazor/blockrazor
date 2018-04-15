import { Meteor } from 'meteor/meteor'
import { UserData, Currencies, PendingCurrencies, RejectedCurrencies, ChangedCurrencies, REWARDCOEFFICIENT } from '/imports/api/indexDB.js'

Meteor.publish('approvedcurrencies', function currenciesPublication() {
  return Currencies.find();
})

import { quality } from '/imports/api/utilities'

Meteor.publish('dataQualityCurrencies', function(limit) {
  let query
  if (limit){
    query = Currencies.find({}, {limit: limit})
  } else {
    query = Currencies.find({})
  }
  let sub = query.observeChanges({ // using observer changes, we can transform the data before it's published
    added: (id, fields) => {
      this.added('currencies', id, _.extend(fields, {
        quality: quality(fields) // add quality field, so we can sort by it
      }))
    },
    changed: (id, fields) => {
      this.changed('currencies', id, _.extend(fields, {
        quality: quality(fields)
      }))
    },
    removed: id => {
      this.removed('currencies', id)
    }
  })

  this.ready()

  this.onStop(() => {
    sub.stop()
  })
})

const calculateReward = (currency) => { // domain specific calculateReward from bounties.js, it's more optimal this way
  return (((new Date().getTime() - currency.createdAt) / REWARDCOEFFICIENT) * 0.9)
}

Meteor.publish('bountyCurrencies', function(limit, skip) {
  limit = limit || 0
  skip = skip || 0

  let sub = Currencies.find({
    hashpowerApi: {
      $ne: true
    } // skip all currencies that don't need to show on the bounty page
  }, {
    limit: limit,
    skip: skip,
    sort: {
      createdAt: 1 // equal to sorting by reward
    }
  }).observeChanges({ // using observer changes, we can transform the data before it's published
    added: (id, fields) => {
      this.added('currencies', id, _.extend(fields, {
        reward: calculateReward(fields) // add reward field
      }))
    },
    changed: (id, fields) => {
      this.changed('currencies', id, _.extend(fields, {
        reward: calculateReward(fields)
      }))
    },
    removed: id => {
      this.removed('currencies', id)
    }
  })

  this.ready()

  this.onStop(() => {
    sub.stop()
  })
})

Meteor.publish('approvedcurrenciesUser', slug => {
  let user = Meteor.users.findOne({
    slug: slug
  })

  if (user) {
    return Currencies.find({
      owner: user._id
    })
  } else {
    return []
  }
})

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
          return ChangedCurrencies.find({status: { $nin: ['merged','deleted']}});
      }
  });

Meteor.publish('rejectedcurrencies', function rejected() {
  if(UserData.findOne({_id: this.userId}).moderator) {
      return RejectedCurrencies.find();
  } else {
    return RejectedCurrencies.find({owner: this.userId});
  }
});
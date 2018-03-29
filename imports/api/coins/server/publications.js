import { Meteor } from 'meteor/meteor'
import { UserData, Currencies, PendingCurrencies, RejectedCurrencies, ChangedCurrencies } from '/imports/api/indexDB.js'

Meteor.publish('approvedcurrencies', function currenciesPublication() {
  return Currencies.find();
})

import { quality } from '/imports/api/utilities'

Meteor.publish('dataQualityCurrencies', function() {
  let sub = Currencies.find({}).observeChanges({ // using observer changes, we can transform the data before it's published
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
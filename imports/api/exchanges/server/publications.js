import { Meteor } from 'meteor/meteor'
import { Exchanges } from '/imports/api/indexDB.js'

Meteor.publish('exchanges', function () {
  return Exchanges.find();
})

Meteor.publish('modExchanges', function () {
  return Exchanges.find({
  	removalProposed: true
  })
})

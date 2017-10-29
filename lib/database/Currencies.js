import { Mongo } from 'meteor/mongo';
export const Currencies = new Mongo.Collection('currencies');
export const PendingCurrencies = new Mongo.Collection('pendingcurrencies');

if (Meteor.isServer) {
  import { UserData } from '../../server/serverdb/UserData.js';
  Meteor.publish('approvedcurrencies', function currenciesPublication() {
    return Currencies.find();
  });

  Meteor.publish('pendingcurrencies', function pending() {
    if(UserData.findOne({_id: Meteor.user()._id}).moderator) {
        return PendingCurrencies.find();
    } else {
      return PendingCurrencies.find({owner: Meteor.user()._id});
    }
  })
  }

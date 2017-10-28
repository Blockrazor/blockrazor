import { Mongo } from 'meteor/mongo';
export const Currencies = new Mongo.Collection('currencies');

if (Meteor.isServer) {
Meteor.publish('approvedcurrencies', function currenciesPublication() {
return Currencies.find({approved: true});
});
Meteor.publish('pendingcurrencies', function currenciesPublication() {
return Currencies.find({approved: false});
});
}

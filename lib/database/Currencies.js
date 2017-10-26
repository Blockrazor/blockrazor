import { Mongo } from 'meteor/mongo';
export const Currencies = new Mongo.Collection('currencies');

if (Meteor.isServer) {
Meteor.publish('currencies', function currenciesPublication() {
return Currencies.find();
});
}

import { Mongo } from 'meteor/mongo';
export const Currencies = new Mongo.Collection('currencies');

if (Meteor.isServer) {
Meteor.publish('currencies', function currenciesPublication() {
return Currencies.find();
});
}

var Schemas = {};

Schemas.Currency =  new SimpleSchema({
currencyName: {
type: String,
optional: false,
min: 3,
max: 20
},

currencySymbol: {
  type: String,
  optional: false,
  min: 2,
  max: 5
},

marketCap: {
  type: Number,
  optional: true
},

circulating: {
  type: Number,
  optional: true
},

price: {
  type: Number,
  optional: true
}

})

Currencies.attachSchema(Schemas.Currency);

if (Meteor.isServer) {
Meteor.methods({
  addCoin(currency, symbol) {
 Currencies.insert({
 currencyName: currency,
 currencySymbol: symbol,
 createdAt: new Date(),
 }, function(error, result){
 if (!result) {
 console.log(error);
 //return error;
 throw new Meteor.Error('Invalid', error);
 } else {
   //console.log(error);
   //console.log(result);
   return result;
 }
 });
  }
})
}

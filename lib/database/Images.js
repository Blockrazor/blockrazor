import { Mongo } from 'meteor/mongo';
export var WalletImages = new Mongo.Collection('walletimages');

if(Meteor.isServer){
  Meteor.publish('walletimages', function walletimagesPublication() {
  return WalletImages.find();
  });
}

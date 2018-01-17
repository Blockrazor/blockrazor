import { Mongo } from 'meteor/mongo';
export var WalletImages = new Mongo.Collection('walletimages');

if(Meteor.isServer){
  Meteor.publish('walletimages', function walletimagesPublication(id) {

  	if(id){
  		return WalletImages.find({currencyId:id});
  	}else{
  		return WalletImages.find();
  	}
  
  });

}

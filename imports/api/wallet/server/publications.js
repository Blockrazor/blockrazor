import { Meteor } from 'meteor/meteor'
import { WalletImages, Wallet } from '/imports/api/indexDB.js'

Meteor.publish('walletimages', function walletimagesPublication(id) {
  if(id){
    return WalletImages.find({currencyId:id});
  }else{
    return WalletImages.find();
  }
})

Meteor.publish('walletImagesSlug', slug => WalletImages.find({
  currencySlug: slug
}))

Meteor.publish('wallet', function wallet() {
  if(Wallet.findOne({owner: this.userId})) {
    return Wallet.find({owner: this.userId});
  } else {
    return null;
  }
})
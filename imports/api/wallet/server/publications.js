import { Meteor } from 'meteor/meteor'
import { WalletImages, Wallet, UserData } from '/imports/api/indexDB.js'

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

Meteor.publish('walletsMod', () => {
  let user = UserData.findOne({
    _id: Meteor.userId()
  })

  if (Meteor.userId() && user && user.moderator) { // just in case the user is a moderator
    return Wallet.find({
      $and: [{
        $or: [{
          from: 'Blockrazor'
        }, {
          from: 'System'
        }],
        $or: [{
          currency: 'KZR'
        }, {
          currency: {
            $exists: false
          }
        }],
        type: 'transaction'
      }]
    }, {
      fields: {
        owner: 1,
        amount: 1
      } // show only necessary fields
    })
  } else {
    return null
  }
})
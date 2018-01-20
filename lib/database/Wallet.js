import { Mongo } from 'meteor/mongo';
export var Wallet = new Mongo.Collection('wallet');

if (Meteor.isServer) {
Meteor.methods({
  initializeWallet: function() {
    if (_.size(Wallet.findOne({owner: this.userId})) == 0) {
      Wallet.insert({
        time: new Date().getTime(),
        owner: this.userId,
        type: "transaction",
        from: "System",
        message: "Welcome to Blockrazor! Your wallet has been created. Why not head over to the Bounty list and earn your first Rozar!",
        amount: 0
      })
      }
    }

});

Meteor.publish('wallet', function wallet() {
  if(Wallet.findOne({owner: this.userId})) {
    return Wallet.find({owner: this.userId});
  } else {
    return null;
  }
})
};

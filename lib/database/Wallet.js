import { Mongo } from 'meteor/mongo';
export var Wallet = new Mongo.Collection('wallet');

if (Meteor.isServer) {
Meteor.methods({
  initializeWallet: function() {
    if (_.size(Wallet.findOne({owner: Meteor.user()._id})) == 0) {
      Wallet.insert({
        time: new Date().getTime(),
        owner: Meteor.user()._id,
        type: "transaction",
        from: "System",
        message: "Welcome to Blockrazor! Your wallet has been created. Why not head over to the Bounty list and earn your first Rozar!",
        amount: 0
      })
      }
    }

});

Meteor.publish('wallet', function wallet() {
  if(Wallet.findOne({owner: Meteor.user()._id})) {
    return Wallet.find({owner: Meteor.user()._id});
  } else {
    return null;
  }
})
};

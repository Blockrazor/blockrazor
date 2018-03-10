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
    },
    markAsRead: function() {
      if (!Meteor.userId()) { throw new Meteor.Error('error', 'please log in') };

      Wallet.update({
          owner: Meteor.userId(),
      }, {
          $set: {
              read: true
          }
      }, {
          multi: true
      }, function(error) {
          if (error) {
              log.error('Error in markNotificationsAsRead', error)
              throw new Meteor.Error(500, error.message);
          }
      });

  },
  transactionCount: () => Wallet.find({
    type: 'transaction',
    amount: {
      $nin: [0, NaN] // filter out invalid transactions
    }
  }).count(),
  totalAmount: () => {
    let transactions = Wallet.find({}).fetch()

    let sum = 0
    transactions.forEach(i => {
      // sum only transactions from the main wallet
      sum += (((i.from === 'System' || i.from === 'Blockrazor') && !isNaN(i.amount)) ? i.amount : 0)
    })

    return sum.toFixed(2)
  },
  transactions: (page) => {
    return Wallet.find({
      type: 'transaction',
      amount: {
        $nin: [0, NaN] // filter out invalid transactions
      }
    }, {
      sort: {
        time: -1
      },
      fields: {
        time: 1,
        owner: 1,
        from: 1,
        amount: 1
      },
      skip: (page - 1) * 10,
      limit: 10 // show 10 transactions per page
    }).fetch()
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

import { Template } from 'meteor/templating';
import { Wallet, UserData } from '/imports/api/indexDB.js';

import '/imports/ui/components/notLoggedIn.html'
import './wallet.html'
import './walletItem'

Template.wallet.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function() {
    SubsCache.subscribe('wallet');
  })

  //mark notifications read
  Meteor.call('markAsRead',
  (error, result) => {
      if (error) {
          console.error(error)
      }
  }
);
});

Template.wallet.helpers({
  entry (){
    return Wallet.find({type: "transaction"}, {sort: {time: -1 }});
  },
  balance () {
    return UserData.findOne({}, {fields: {balance: 1}}).balance
  }
});

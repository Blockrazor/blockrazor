import { Template } from 'meteor/templating';
import { Wallet } from '../../lib/database/Wallet.js';

Template.wallet.onCreated(function bodyOnCreated() {
  Meteor.subscribe('wallet');
});

Template.wallet.onRendered( function () {
//console.log(wallet.find({id}).fetch())
});

Template.wallet.helpers({
  entry (){
    return Wallet.find({type: "transaction"}, {sort: {time: -1 }});
  },
  balance () {
    return ReactiveMethod.call('getBalance')
  }
});

Template.walletItem.helpers({
  time() {
        return moment(this.time).fromNow();
      }
});

import { Template } from 'meteor/templating';
import { Wallet, UserData } from '/imports/api/indexDB.js';

import '/imports/ui/components/notLoggedIn.html'
import './wallet.html'
import './walletItem'

Template.wallet.onCreated(function bodyOnCreated() {

  this.rewardType = new ReactiveVar()


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

Template.wallet.onRendered(function() {
    $(".form-inline").removeClass("form-inline")
});

Template.wallet.helpers({
  entry (){
var filter = Template.instance().rewardType.get();

if(filter){
  var query = {type: "transaction",rewardType:filter}
}else{
  var query = {type: "transaction"}
}

    return Wallet.find(query, {sort: {time: -1 }});
  },
  balance () {
    return UserData.findOne({}, {fields: {balance: 1}}).balance
  },
  walletTable: function () {
      return {
          noDataTmpl: 'noDataTmpl',
          rowsPerPage: 100,
          showFilter: false,
          fields: [
                 {
                   key: 'message',
                   label: 'Message',
                 },
                                  {
                   key: 'amount',
                   label: 'Amount',
                 },
                 {
                   key: 'time',
                   label: 'Date / Time',
                   sortByValue: true,
                   fn: function(value, object, key) { return moment(value).fromNow(); }
                 },                 {
                   key: 'from',
                   label: 'From',
                 },
                                  {
                   key: 'rewardType',
                   label: 'Type',
                   fn: function(value, object, key) { return transactionTypes(value); }

                 },




               ]
                         };
  }

});

Template.wallet.events({
    'change .rewardTypeFilter': function(event) {
        Template.instance().rewardType.set(event.target.value)
    },
    'click .clearFilter': function(event) {
        Template.instance().rewardType.set(false);

        $(".rewardTypeFilter option").filter(function() {
            return $(this).text() == "--Select transaction type--";
        }).prop('selected', true);
    }
});
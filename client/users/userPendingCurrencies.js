import { Template } from 'meteor/templating';
import { PendingCurrencies } from '../../lib/database/Currencies.js';
import { RejectedCurrencies } from '../../lib/database/Currencies.js';

Template.userPendingCurrencies.onCreated(function bodyOnCreated() {
  Meteor.subscribe('pendingcurrencies');
  Meteor.subscribe('rejectedcurrencies');
});

Template.userPendingCurrencies.onRendered( function () {

});

Template.userPendingCurrencies.helpers({
  pendingcurrencies() {
    if(_.size(PendingCurrencies.find({owner: Meteor.user()._id}).fetch()) == 0) {
      Session.set('pending', "You have no currencies or changes waiting approval");
    } else {
      Session.set('pending', "");
      return PendingCurrencies.find({owner: Meteor.user()._id});
    }
  },
  rejectedcurrencies() {
    if(_.size(RejectedCurrencies.find({owner: Meteor.user()._id}).fetch()) == 0) {
      Session.set('rejectedcoins', "You have no rejected currencies or changes");
    } else {
      Session.set('rejectedcoins', "");
      return RejectedCurrencies.find({owner: Meteor.user()._id});
    }
  },
});

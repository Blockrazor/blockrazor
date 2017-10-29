import { Template } from 'meteor/templating';
import { PendingCurrencies } from '../../lib/database/Currencies.js';

Template.userPendingCurrencies.onCreated(function bodyOnCreated() {
  Meteor.subscribe('pendingcurrencies');
});

Template.userPendingCurrencies.onRendered( function () {

});

Template.userPendingCurrencies.helpers({
  currencies() {
        return PendingCurrencies.find();
      }
});

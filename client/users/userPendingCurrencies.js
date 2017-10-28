import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';

Template.userPendingCurrencies.onCreated(function bodyOnCreated() {
  Meteor.subscribe('pendingcurrencies');
});

Template.userPendingCurrencies.onRendered( function () {

});

Template.userPendingCurrencies.helpers({
  currencies() {
        return Currencies.find({owner: Meteor.userId()}, { sort: { createdAt: -1 }, limit: 20});
      }
});

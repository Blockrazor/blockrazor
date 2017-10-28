import { Template } from 'meteor/templating';
import { Currencies } from '../lib/database/Currencies.js';

Template.pendingCurrencies.onCreated(function bodyOnCreated() {
  Meteor.subscribe('pendingcurrencies');
});

Template.pendingCurrencies.onRendered( function () {

});

Template.pendingCurrencies.helpers({
  currencies() {
        return Currencies.find({owner: Meteor.userId()}, { sort: { createdAt: -1 }, limit: 20});
      }
});

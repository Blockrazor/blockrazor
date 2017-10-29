import { Template } from 'meteor/templating';
import { PendingCurrencies } from '../../lib/database/Currencies.js';

Template.moderatorDash.onCreated(function bodyOnCreated() {
  Meteor.subscribe('pendingcurrencies');
});

Template.moderatorDash.onRendered( function () {

});

Template.moderatorDash.helpers({
  pendingCurrencies() {
        return PendingCurrencies.find({}, { sort: { createdAt: -1 }, limit: 20});
      }
});

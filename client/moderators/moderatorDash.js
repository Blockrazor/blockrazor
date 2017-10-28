import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';

Template.moderatorDash.onCreated(function bodyOnCreated() {
  Meteor.subscribe('pendingcurrencies');
});

Template.moderatorDash.onRendered( function () {

});

Template.moderatorDash.helpers({
  currencies() {
        return Currencies.find({}, { sort: { createdAt: -1 }, limit: 20});
      }
});

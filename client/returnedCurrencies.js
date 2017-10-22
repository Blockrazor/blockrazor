import { Template } from 'meteor/templating';
import { Currencies } from '../lib/database/Currencies.js';

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
});

Template.returnedCurrencies.onRendered( function () {
//Meteor.call('updateMarketCap');
});

Template.returnedCurrencies.helpers({
  currencies() {
    if (FlowRouter.getParam("_id")) {
      console.log(FlowRouter.getParam("_id"))
      return Currencies.find({_id: FlowRouter.getParam("_id")}, {}).fetch();
    } else {
        return Currencies.find({}, { sort: { createdAt: -1 }, limit: 20});
      }}

});

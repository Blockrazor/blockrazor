import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    self.subscribe('approvedcurrencies');
  })
});

Template.returnedCurrencies.onRendered( function () {
  console.log(Currencies.findOne())
//Meteor.call('updateMarketCap');
});

Template.returnedCurrencies.helpers({
  currencies() {
    // if (FlowRouter.getParam("_id")) {
    //   return Currencies.find({_id: FlowRouter.getParam("_id")}, {}).fetch();
    // } else {
        return Currencies.find({}, { sort: { createdAt: -1 }, limit: 20});
      }//}
});

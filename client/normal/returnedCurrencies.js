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

//quick funcion to clear all attribute sessions within the filter
function clearSessions(){
    Session.set('currencyNameFilter',undefined);
    Session.set('currencySymbolFilter',undefined);
    Session.set('genesisTimestampFilter',undefined);
    Session.set('premineFilter',undefined);
    Session.set('circulatingFilter',undefined);
    Session.set('maxCoinsFilter',undefined);
    Session.set('consensusSecurityFilter',undefined);
    Session.set('hashAlgorithmFilter',undefined);
    Session.set('marketCapFilter',undefined);
    Session.set('priceFilter',undefined);
    Session.set('gitCommitsFilter',undefined);
    Session.set('filterCount',undefined);
}

Template.returnedCurrencies.helpers({
  currencies() {

    var currencyNameFilter = Session.get('currencyNameFilter');
    var currencySymbolFilter = Session.get('currencySymbolFilter');
    var genesisTimestampFilter = Session.get('genesisTimestampFilter');
    var premineFilter = Session.get('premineFilter');
    var circulatingFilter = Session.get('circulatingFilter');
    var maxCoinsFilter = Session.get('maxCoinsFilter');
    var consensusSecurityFilter = Session.get('consensusSecurityFilter');
    var hashAlgorithmFilter = Session.get('hashAlgorithmFilter');
    var marketCapFilter = Session.get('marketCapFilter');
    var priceFilter = Session.get('priceFilter');
    var gitCommitsFilter = Session.get('gitCommitsFilter');

  //filter
  var filter = {};


  if (currencyNameFilter !== undefined || currencyNameFilter == '') {
    filter.currencyName = { $regex : new RegExp(currencyNameFilter, "i") };
  }
  if (currencySymbolFilter !== undefined || currencySymbolFilter == '') {
    filter.currencySymbol = { $regex : new RegExp(currencySymbolFilter, "i") };
  }
  if (premineFilter !== undefined || premineFilter == '') {
    filter.premine = {$gt: Number(premineFilter)};
  }
  if (circulatingFilter !== undefined || circulatingFilter == '') {
    filter.circulating = {$gt: Number(circulatingFilter)};
  }

  //return 0 if filter is 
  if(!_.isEmpty(filter)){
    var filterQuestCount = Currencies.find(filter).count()
    console.log(filterQuestCount)
    if(filterQuestCount){
      Session.set('filterCount',filterQuestCount);
    }else{
      return Session.set('filterCount',0);;
    }
  }


  return Currencies.find(filter, { sort: { createdAt: -1 }, limit: 20});
      }
});




Template.returnedCurrencies.events({
  'submit #currencyFilter': function(event) {
    event.preventDefault();
    var et = event.target;

    clearSessions()

    if(et.currencyName.value){
     var currencyNameFilter = Session.set('currencyNameFilter',et.currencyName.value); //done
    }
    if(et.currencySymbol.value){
    var currencySymbolFilter = Session.set('currencySymbolFilter',et.currencySymbol.value); //done
    }
    //var genesisTimestampFilter = Session.set('genesisTimestampFilter',et.genesisTimestamp.value); //wait until we have a time UI element
    if(et.premine.value){
    var premineFilter = Session.set('premineFilter',et.premine.value);
    }
    if(et.circulating.value){
    var circulatingFilter = Session.set('circulatingFilter',et.circulating.value);
    }
    var maxCoinsFilter = Session.set('maxCoinsFilter');
    var consensusSecurityFilter = Session.set('consensusSecurityFilter');
    var hashAlgorithmFilter = Session.set('hashAlgorithmFilter');
    var marketCapFilter = Session.set('marketCapFilter');
    var priceFilter = Session.set('priceFilter');
    var gitCommitsFilter = Session.set('gitCommitsFilter');


  },
    'click #clear': function(event) {
    event.preventDefault();
    //clear all values in filter
    $('#currencyFilter').trigger("reset");

    //set all session to undefined, its undefined as the currencies() helper checks on this
    clearSessions();

  },
      'click #toggle': function(event) {
    event.preventDefault();
    $('#currencyFilterContainer').toggle();
  }
  })

  Template.currencyFilter.helpers({
    filterCount() {
      return Session.get('filterCount');
    }

    });

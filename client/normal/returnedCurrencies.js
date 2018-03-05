import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    self.subscribe('approvedcurrencies');
  })

  this.currencyNameFilter = new ReactiveVar(undefined);
  this.currencySymbolFilter = new ReactiveVar(undefined);
  this.genesisTimestampFilter = new ReactiveVar(undefined);
  this.premineFilter = new ReactiveVar(undefined);
  this.circulatingFilter = new ReactiveVar(undefined);
  this.maxCoinsFilter = new ReactiveVar(undefined);
  this.consensusSecurityFilter = new ReactiveVar(undefined);
  this.hashAlgorithmFilter = new ReactiveVar(undefined);
  this.marketCapFilter = new ReactiveVar(undefined);
  this.priceFilter = new ReactiveVar(undefined);
  this.gitCommitsFilter = new ReactiveVar(undefined);
  this.filterCount = new ReactiveVar(undefined);
});

Template.returnedCurrencies.onRendered( function () {
//  console.log(Currencies.findOne())
//Meteor.call('updateMarketCap');
});

//quick funcion to clear all attribute sessions within the filter
function clearSessions(){
    Template.instance().currencyNameFilter.set(undefined);
    Template.instance().currencySymbolFilter.set(undefined);
    Template.instance().genesisTimestampFilter.set(undefined);
    Template.instance().premineFilter.set(undefined);
    Template.instance().circulatingFilter.set(undefined);
    Template.instance().maxCoinsFilter.set(undefined);
    Template.instance().consensusSecurityFilter.set(undefined);
    Template.instance().hashAlgorithmFilter.set(undefined);
    Template.instance().marketCapFilter.set(undefined);
    Template.instance().priceFilter.set(undefined);
    Template.instance().gitCommitsFilter.set(undefined);
    Template.instance().filterCount.set(undefined);
}

Template.returnedCurrencies.helpers({
  currencies() {

    var currencyNameFilter = Template.instance().currencyNameFilter.get();
    var currencySymbolFilter = Template.instance().currencySymbolFilter.get();
    var genesisTimestampFilter = Template.instance().genesisTimestampFilter.get();
    var premineFilter = Template.instance().premineFilter.get();
    var circulatingFilter = Template.instance().circulatingFilter.get();
    var maxCoinsFilter = Template.instance().maxCoinsFilter.get();
    var consensusSecurityFilter = Template.instance().consensusSecurityFilter.get();
    var hashAlgorithmFilter = Template.instance().hashAlgorithmFilter.get();
    var marketCapFilter = Template.instance().marketCapFilter.get();
    var priceFilter = Template.instance().priceFilter.get();
    var gitCommitsFilter = Template.instance().gitCommitsFilter.get();

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
      Template.instance().filterCount.set(filterQuestCount);
    }else{
      return Template.instance().filterCount.set(0);;
    }
  }


  return Currencies.find(filter, { sort: { createdAt: -1 }, limit: 20,
  fields: {
    slug: 1,
    currencySymbol: 1,
    marketCap: 1,
    maxCoins: 1,
    hashpower: 1,
    genesisTimestamp: 1,
    circulating: 1,
    currencyName: 1,
    communityRanking: 1,
    codebaseRanking: 1,
    walletRanking: 1,
    decentralizationRanking: 1,
    gitCommits: 1,
  }
});
      }
});




Template.returnedCurrencies.events({
  'submit #currencyFilter': function(event) {
    event.preventDefault();
    var et = event.target;

    clearSessions()

    if(et.currencyName.value){
     var currencyNameFilter = Template.instance().currencyNameFilter.set(et.currencyName.value); //done
    }
    if(et.currencySymbol.value){
    var currencySymbolFilter = Template.instance().currencySymbolFilter.set(et.currencySymbol.value); //done
    }
    //var genesisTimestampFilter = Template.instance().genesisTimestampFilter.set(et.genesisTimestamp.value); //wait until we have a time UI element
    if(et.premine.value){
    var premineFilter = Template.instance().premineFilter.set(et.premine.value);
    }
    if(et.circulating.value){
    var circulatingFilter = Template.instance().circulatingFilter.set(et.circulating.value);
    }
    var maxCoinsFilter = Template.instance().maxCoinsFilter.set('');
    var consensusSecurityFilter = Template.instance().consensusSecurityFilter.set('');
    var hashAlgorithmFilter = Template.instance().hashAlgorithmFilter.set('');
    var marketCapFilter = Template.instance().marketCapFilter.set('');
    var priceFilter = Template.instance().priceFilter.set('');
    var gitCommitsFilter = Template.instance().gitCommitsFilter.set('');


  },
    'click #clear': function(event) {
    event.preventDefault();
    //clear all values in filter
    $('#currencyFilter').trigger("reset");

    //set all session to undefined, its undefined as the currencies() helper checks on this
    clearSessions();

  },
  'change input': function(event) { 
    event.preventDefault(); 
    if($(event.target).val().length > 0){ 
        $(event.target).addClass('filled'); 
      } 
      else{ 
        $(event.target).removeClass('filled'); 
      } 
    } 
  })

  Template.currencyFilter.helpers({
    filterCount() {
      // Blaze's API function for cross-template communication
      return Template.instance().view.parentView.templateInstance().filterCount.get();
    }

    });

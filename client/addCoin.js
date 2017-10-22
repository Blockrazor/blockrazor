import { Template } from 'meteor/templating';
import { Currencies } from '../lib/database/Currencies.js'; //database


Template.returnedCurrencies.onRendered( function () {
});


Template.addCoin.events({
  'click #cancel': function(data) {
    console.log(data);
    FlowRouter.go('/');
  },
  'submit form': function(data){
  var d = data.target;

  var insert = {
    currencyName: d.currencyName.value,
    currencySymbol: d.currencySymbol.value,
    genesisTimestamp: Date.parse(d.genesisYear.value + "-" + d.genesisMonth.value + "-" + d.genesisDay.value),
    premine: d.premine.value,
    maxCoins: d.maxCoins.value,
    consensusSecurity: d.consensusSecurity.value,
    hashAlgorithm: d.hashAlgorithm.value,
    gitRepo: d.gitRepo.value,
    createdAt: new Date(), // current time
  };


  // Currencies.insert({
  //   currencyName: d.currencyName.value,
  //   currencySymbol: d.currencySymbol.value,
  //   genesisTimestamp: Date.parse(d.genesisYear.value + "-" + d.genesisMonth.value + "-" + d.genesisDay.value),
  //   premine: d.premine.value,
  //   maxCoins: d.maxCoins.value,
  //   consensusSecurity: d.consensusSecurity.value,
  //   hashAlgorithm: d.hashAlgorithm.value,
  //   gitRepo: d.gitRepo.value,
  //   createdAt: new Date(), // current time
  // });
    data.preventDefault();
    //console.log(d.currencyName.value);
    Meteor.call('addCoin', insert, function(error, result){
      if(error) {
        console.log(error);
      } else {
        console.log(result);
      }
    });
    // document.getElementById("addCurrency").reset();
      }
});

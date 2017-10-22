import { Template } from 'meteor/templating';
import { Currencies } from '../lib/database/Currencies.js'; //database

//Functions to help with client side validation and data manipulation
var makeTagArrayFrom = function(string) {
  if (!string) {return new Array()};
  var array = string.split(",");
  console.log($.map(array, $.trim));
  return $.map(array, $.trim).filter(function(v){return v!==''});
}

//Events
Template.addCoin.events({
  'change #consensusType': function(consensusType) {
    //Session.set('consensusType', consensusType.target.value);
    console.log(consensusType.target.value);
  },

  'click #cancel': function(data) {
    console.log(data);
    FlowRouter.go('/');
  },
  'submit form': function(data){
  var d = data.target;
  var launchTags = null;

  if (d.ICO.checked || d.BTCFork.checked) {
    launchTags = new Array();
    if (d.ICO.checked) {launchTags.push("ICO")};
    if (d.BTCFork.checked) {launchTags.push("Bitcoin Fork")};
  }


  var insert = {
    currencyName: d.currencyName.value,
    currencySymbol: d.currencySymbol.value.toUpperCase(),
    genesisTimestamp: Date.parse(d.genesisYear.value + "-" + d.genesisMonth.value + "-" + d.genesisDay.value),
    premine: d.premine.value ? parseInt(d.premine.value) : 0,
    maxCoins: parseInt(d.maxCoins.value),
    consensusSecurity: d.consensusSecurity.value,
    gitRepo: d.gitRepo.value,
    officialSite: d.officialSite.value,
    reddit: d.reddit.value,
    previousNames: makeTagArrayFrom(d.previousNames.value),
    featureTags: makeTagArrayFrom(d.featureTags.value),
    exchanges: makeTagArrayFrom(d.exchanges.value),
    blockTime: parseInt(d.blockTime.value),
    confirmations: parseInt(d.confirmations.value),
    approvalNotes: d.notes.value,

    createdAt: new Date(), // current time
  };

  var insertIfExists = function(value, key) {
    if (typeof key !== "undefined") {
      insert[key] = value; //slip the data into the 'insert' array
    } else if (eval(value) && typeof key === "undefined") { //check that 'value' actually has data and that there is no 'key'
      insert[value] = eval(value); //use the String from 'value' as the key, and evaluate the variable of the same name to get the data.
    }
  }

// Start inserting data that may or may not exist
  insertIfExists("launchTags");
  insertIfExists(d.hashAlgorithm.value, "hashAlgorithm");

  //console.log(insert);
    data.preventDefault(); //this goes after the 'insert' array is built, strange things happen when it's used too early

//Send everything to the server for fuckery prevention and database insertion
    Meteor.call('addCoin', insert, function(error, result){
      if(error) {
        console.log(error);
      } else {
        console.log(result);
        FlowRouter.go('/');
      }
    });

    // document.getElementById("addCurrency").reset();
      }
});

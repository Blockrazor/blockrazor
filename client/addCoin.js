import { Template } from 'meteor/templating';
import { FormData } from '../lib/database/FormData.js'; //database

//Functions to help with client side validation and data manipulation
var makeTagArrayFrom = function(string) {
  if (!string) {return new Array()};
  array = $.map(string.split(","), $.trim).filter(function(v){return v!==''});
  var namedArray = new Array();
  for (i in array) {
    var string = array[i].toString().replace(/[^\w\s]/gi, '');
    if(string) {
      namedArray.push({"tag": string});
    }
  }
  return namedArray;
}

Template.addCoin.onRendered(function() {
  Session.set('coinExists', true);
  Session.set('POWSelect', false);
  Session.set('btcfork', false);
  Session.set('isICO', false);
});

//Events
Template.addCoin.events({
  'change .isICO': function(dataFromForm) {
    Session.set('isICO', dataFromForm.target.checked);
  },
  'change .btcfork': function(dataFromForm) {
    Session.set('btcfork', dataFromForm.target.checked);
  },
  'change .exists': function(dataFromForm) {
    Session.set('coinExists', dataFromForm.target.checked);
  },
  'change #consensusType': function(consensusType) {
    Session.set('consensusType', consensusType.target.value);
    if (consensusType.target.value == "Proof of Work" || consensusType.target.value == "Hybrid") {
      Session.set('POWSelect', true);
    } else {
      Session.set('POWSelect', false);
    }
    console.log(Session.get('consensusType'))
  },


  'click #cancel': function(data) {
    console.log(data);
    FlowRouter.go('/');
  },
  'submit form': function(data){
    data.preventDefault();
  var d = data.target;

  launchTags = new Array();
  if (d.ICO.checked || d.BTCFork.checked) {
    if (d.ICO.checked) {launchTags.push({"tag": "ICO"})};
    if (d.BTCFork.checked) {launchTags.push({"tag": "Bitcoin Fork"})};
  } else if (launchTags.length == 0) {
    launchTags.push({"tag": "Altcoin"})
  }

  if(!d.exists.checked) {
    launchTags.push({"tag": "proposal"})
  }

  var insert = {
    currencyName: d.currencyName.value,
    currencySymbol: d.currencySymbol.value.toUpperCase(),
    premine: d.premine.value ? parseInt(d.premine.value) : 0,
    maxCoins: parseInt(d.maxCoins.value),
    consensusSecurity: d.consensusSecurity.value,
    gitRepo: d.gitRepo.value,
    officialSite: d.officialSite.value,
    reddit: d.reddit.value,
    featureTags: makeTagArrayFrom(d.featureTags.value),
    confirmations: parseInt(d.confirmations.value),
    approvalNotes: d.notes.value,
    createdAt: new Date(), // current time
  };

  var addToInsert = function(value, key) {
    if (typeof key !== "undefined") {
      insert[key] = value; //slip the data into the 'insert' array
    } else if (eval(value) && typeof key === "undefined") { //check that 'value' actually has data and that there is no 'key'
      insert[value] = eval(value); //use the String from 'value' as the key, and evaluate the variable of the same name to get the data.
    }
  }

// Start inserting data that may or may not exist

  if(d.previousNames) {addToInsert(makeTagArrayFrom(d.previousNames.value), "previousNames")};
  if(d.exchanges) {addToInsert(makeTagArrayFrom(d.exchanges.value), "exchanges")};
  addToInsert("launchTags");
  if(d.blockTime) {addToInsert(parseInt(d.blockTime.value), "blockTime")};
  if(d.forkHeight) {addToInsert(d.forkHeight.value, "forkHeight")};
  if(d.forkParent) {addToInsert(d.forkParent.value, "forkParent")};
  if(d.hashAlgorithm) {addToInsert(d.hashAlgorithm.value, "hashAlgorithm")};
  if(d.icocurrency) {addToInsert(d.icocurrency.value, "icocurrency")};
  if(d.ICOfundsRaised) {addToInsert(parseInt(d.ICOfundsRaised.value), "ICOfundsRaised")};
  if(d.icocurrency) {addToInsert(d.icocurrency.value, "icocurrency")};
  if(d.genesisYear) {addToInsert(Date.parse(d.genesisYear.value + "-" + d.genesisMonth.value + "-" + d.genesisDay.value), "genesisTimestamp")};

    data.preventDefault(); //this goes after the 'insert' array is built, strange things happen when it's used too early

//Send everything to the server for fuckery prevention and database insertion
    Meteor.call('addCoin', insert, function(error, result){
      if(error) {
        console.log(error);
      } else {
        FlowRouter.go('/');
      }
    });

    // document.getElementById("addCurrency").reset();
      }
});



Template.addCoin.helpers({
  security () {
    return FormData.find({}, {});
  },
  subsecurity () {
   return FormData.findOne({name: Session.get('consensusType')}, {}).subsecurity;
  },
  coinExists () {
    return Session.get('coinExists')
  },

  icoText () {
    if (Session.get('coinExists')) {
        return "Funds were raised prior to the genesis block being mined (ICO)"
    } else {
        return "This is planned as an ICO"
    }},
  btcForkText () {
    if (Session.get('coinExists')) {
        return "This was a fork of the Bitcoin blockchain"
    } else {
        return "This is a planned fork of the Bitcoin blockchain"
    }}

  });

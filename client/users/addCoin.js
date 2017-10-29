import { Template } from 'meteor/templating';
import { FormData } from '../../lib/database/FormData.js'; //database


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
//Set form help text display variables
  Session.set('currencyName', false);
  Session.set('currencySymbol', false);
  Session.set('ICOfundsRaised', false);
  Session.set('genesis', false);
  Session.set('forkParent', false);
  Session.set('forkHeight', false);
  Session.set('premine', false);
  Session.set('maxCoins', false);
  Session.set('gitRepo', false);
  Session.set('officialSite', false);
  Session.set('reddit', false);
  Session.set('featureTags', false);
  Session.set('blockTime', false);
  Session.set('confirmations', false);
  Session.set('previousNames', false);
  Session.set('exchanges', false);

});

//Events
Template.addCoin.events({
  //Show and hide form help
  'focus #currencyName': function(){Session.set('currencyName', true)},
  'blur #currencyName': function(e){
    Session.set('currencyName', false);
    Meteor.call('isCurrencyNameUnique', e.currentTarget.value);
    Meteor.call('isCurrencyNameUnique', e.currentTarget.value, function(error, result){
      if(error) {Session.set('currencyNameMessage', error.error)} else {Session.set('currencyNameMessage', null)};
    });
    },
  'focus #currencySymbol': function(){Session.set('currencySymbol', true)},
  'blur #currencySymbol': function(){Session.set('currencySymbol', false)},
  'focus #ICOfundsRaised': function(){Session.set('ICOfundsRaised', true)},
  'blur #ICOfundsRaised': function(){Session.set('ICOfundsRaised', false)},
  'focus #genesis': function(){Session.set('genesis', true)},
  'blur #genesis': function(){Session.set('genesis', false)},
  'focus #forkParent': function(){Session.set('forkParent', true)},
  'blur #forkParent': function(){Session.set('forkParent', false)},
  'focus #forkHeight': function(){Session.set('forkHeight', true)},
  'blur #forkHeight': function(){Session.set('forkHeight', false)},
  'focus #premine': function(){Session.set('premine', true)},
  'blur #premine': function(){Session.set('premine', false)},
  'focus #maxCoins': function(){Session.set('maxCoins', true)},
  'blur #maxCoins': function(){Session.set('maxCoins', false)},
  'focus #gitRepo': function(){Session.set('gitRepo', true)},
  'blur #gitRepo': function(){Session.set('gitRepo', false)},
  'focus #officialSite': function(){Session.set('officialSite', true)},
  'blur #officialSite': function(){Session.set('officialSite', false)},
  'focus #reddit': function(){Session.set('reddit', true)},
  'blur #reddit': function(){Session.set('reddit', false)},
  'focus #featureTags': function(){Session.set('featureTags', true)},
  'blur #featureTags': function(){Session.set('featureTags', false)},
  'focus #blockTime': function(){Session.set('blockTime', true)},
  'blur #blockTime': function(){Session.set('blockTime', false)},
  'focus #confirmations': function(){Session.set('confirmations', true)},
  'blur #confirmations': function(){Session.set('confirmations', false)},
  'focus #previousNames': function(){Session.set('previousNames', true)},
  'blur #previousNames': function(){Session.set('previousNames', false)},
  'focus #exchanges': function(){Session.set('exchanges', true)},
  'blur #exchanges': function(){Session.set('exchanges', false)},

//Select form elements to display to user based on their selection
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
  var insert = {}; //clear insert dataset
  var d = data.target;
console.log(data.target);
  launchTags = new Array();
    if (d.ICO.checked) {launchTags.push({"tag": "ICO"})};
    if (d.BTCFork.checked) {launchTags.push({"tag": "Bitcoin Fork"})};
    if (!d.BTCFork.checked) {launchTags.push({"tag": "Altcoin"})};
    if(!d.exists.checked) {launchTags.push({"tag": "proposal"})};

  var insert = {
    currencyName: d.currencyName.value,
    currencySymbol: d.currencySymbol.value.toUpperCase(),
    premine: d.premine.value ? parseInt(d.premine.value) : 0,
    maxCoins: d.maxCoins.value ? parseInt(d.maxCoins.value) : 0,
    consensusSecurity: d.consensusSecurity.value,
    gitRepo: d.gitRepo.value,
    officialSite: d.officialSite.value,
    reddit: d.reddit.value ? d.reddit.value : false,
    featureTags: makeTagArrayFrom(d.featureTags.value),
    approvalNotes: d.notes.value
  };

  var addToInsert = function(value, key) {
    if (typeof key !== "undefined") {
      insert[key] = value; //slip the data into the 'insert' array
    } else if (eval(value) && typeof key === "undefined") { //check that 'value' actually has data and that there is no 'key'
      insert[value] = eval(value); //use the String from 'value' as the key, and evaluate the variable of the same name to get the data.
    }
  }

// Start inserting data that may or may not exist
  if(d.confirmations) {addToInsert(d.confirmations.value ? parseInt(d.confirmations.value) : 0, "confirmations")};
  if(d.previousNames) {addToInsert(makeTagArrayFrom(d.previousNames.value), "previousNames")};
  if(d.exchanges) {addToInsert(makeTagArrayFrom(d.exchanges.value), "exchanges")};
  addToInsert("launchTags");
  if(d.blockTime) {addToInsert(d.blockTime.value ? parseInt(d.blockTime.value) : 0, "blockTime")};
  if(d.forkHeight) {addToInsert(d.forkHeight.value, "forkHeight")};
  if(d.forkParent) {addToInsert(d.forkParent.value, "forkParent")};
  if(d.hashAlgorithm) {addToInsert(d.hashAlgorithm.value, "hashAlgorithm")};
  if(d.icocurrency) {addToInsert(d.icocurrency.value, "icocurrency")};
  if(d.ICOfundsRaised) {addToInsert(parseInt(d.ICOfundsRaised.value), "ICOfundsRaised")};
  if(d.icocurrency) {addToInsert(d.icocurrency.value, "icocurrency")};
  if(d.genesisYear) {addToInsert(Date.parse(d.genesisYear.value + "-" + d.genesisMonth.value + "-" + d.genesisDay.value), "genesisTimestamp")};
  //if(!insert.genesisTimestamp) {insert.genesisTimestamp = 0};

    data.preventDefault(); //this goes after the 'insert' array is built, strange things happen when it's used too early
//Send everything to the server for fuckery prevention and database insertion
    Meteor.call('addCoin', insert, function(error, result){
      if(error) {
        console.log(error)
      } else {
        FlowRouter.go('/mypending');
      }
    });
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

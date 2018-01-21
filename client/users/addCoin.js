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

Template.addCoin.onCreated(function() {
  this.coinExists = new ReactiveVar(true)
  this.POWSelect = new ReactiveVar(false)
  this.btcfork = new ReactiveVar(false)
  this.isICO = new ReactiveVar(false)
  this.currencyName = new ReactiveVar(false)
  this.currencySymbol = new ReactiveVar(false)
  this.ICOfundsRaised = new ReactiveVar(false)
  this.genesis = new ReactiveVar(false)
  this.forkParent = new ReactiveVar(false)
  this.forkHeight = new ReactiveVar(false)
  this.premine = new ReactiveVar(false)
  this.maxCoins = new ReactiveVar(false)
  this.gitRepo = new ReactiveVar(false)
  this.officialSite = new ReactiveVar(false)
  this.reddit = new ReactiveVar(false)
  this.featureTags = new ReactiveVar(false)
  this.blockTime = new ReactiveVar(false)
  this.confirmations = new ReactiveVar(false)
  this.previousNames = new ReactiveVar(false)
  this.exchanges = new ReactiveVar(false)

  this.currencyNameMessage = new ReactiveVar('')
  this.consensusType = new ReactiveVar('')
})

//Events
Template.addCoin.events({
  //Show and hide form help
  'focus #currencyName': function(){Template.instance().currencyName.set(true)},
  'blur #currencyName': function(e, templateInstance){
    templateInstance.currencyName.set(false);
    Meteor.call('isCurrencyNameUnique', e.currentTarget.value);
    Meteor.call('isCurrencyNameUnique', e.currentTarget.value, function(error, result){
      if(error) {templateInstance.currencyNameMessage.set(error.error)} else {templateInstance.currencyNameMessage.set(null)};
    });
    },
  'focus #currencySymbol': function(){Template.instance().currencySymbol.set(true)},
  'blur #currencySymbol': function(){Template.instance().currencySymbol.set(false)},
  'focus #ICOfundsRaised': function(){Template.instance().ICOfundsRaised.set(true)},
  'blur #ICOfundsRaised': function(){Template.instance().ICOfundsRaised.set(false)},
  'focus #genesis': function(){Template.instance().genesis.set(true)},
  'blur #genesis': function(){Template.instance().genesis.set(false)},
  'focus #forkParent': function(){Template.instance().forkParent.set(true)},
  'blur #forkParent': function(){Template.instance().forkParent.set(false)},
  'focus #forkHeight': function(){Template.instance().forkHeight.set(true)},
  'blur #forkHeight': function(){Template.instance().forkHeight.set(false)},
  'focus #premine': function(){Template.instance().premine.set(true)},
  'blur #premine': function(){Template.instance().premine.set(false)},
  'focus #maxCoins': function(){Template.instance().maxCoins.set(true)},
  'blur #maxCoins': function(){Template.instance().maxCoins.set(false)},
  'focus #gitRepo': function(){Template.instance().gitRepo.set(true)},
  'blur #gitRepo': function(){Template.instance().gitRepo.set(false)},
  'focus #officialSite': function(){Template.instance().officialSite.set(true)},
  'blur #officialSite': function(){Template.instance().officialSite.set(false)},
  'focus #reddit': function(){Template.instance().reddit.set(true)},
  'blur #reddit': function(){Template.instance().reddit.set(false)},
  'focus #featureTags': function(){Template.instance().featureTags.set(true)},
  'blur #featureTags': function(){Template.instance().featureTags.set(false)},
  'focus #blockTime': function(){Template.instance().blockTime.set(true)},
  'blur #blockTime': function(){Template.instance().blockTime.set(false)},
  'focus #confirmations': function(){Template.instance().confirmations.set(true)},
  'blur #confirmations': function(){Template.instance().confirmations.set(false)},
  'focus #previousNames': function(){Template.instance().previousNames.set(true)},
  'blur #previousNames': function(){Template.instance().previousNames.set(false)},
  'focus #exchanges': function(){Template.instance().exchanges.set(true)},
  'blur #exchanges': function(){Template.instance().exchanges.set(false)},

//Select form elements to display to user based on their selection
  'change .isICO': function(dataFromForm) {
    Template.instance().isICO.set(dataFromForm.target.checked);
  },
  'change .btcfork': function(dataFromForm) {
    Template.instance().btcfork.set(dataFromForm.target.checked);
  },
  'change .exists': function(dataFromForm) {
    Template.instance().coinExists.set(dataFromForm.target.checked);
  },
  'change #consensusType': function(consensusType) {
    Template.instance().consensusType.set(consensusType.target.value);
    if (consensusType.target.value == "Proof of Work" || consensusType.target.value == "Hybrid") {
      Template.instance().POWSelect.set(true);
    } else {
      Template.instance().POWSelect.set(false);
    }
  },


  'click #cancel': function(data) {
    console.log(data);
    FlowRouter.go('/');
  },
  'submit form': function(data){
    data.preventDefault();
  var insert = {}; //clear insert dataset
  var d = data.target;
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
    blockExplorer: d.blockExplorer.value ? d.blockExplorer.value : false,
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
  if(d.replayProtection) {addToInsert(d.replayProtection.value, "replayProtection")};
  if(d.blockTime) {addToInsert(d.blockTime.value ? parseInt(d.blockTime.value) : 0, "blockTime")};
  if(d.forkHeight) {addToInsert(parseInt(d.forkHeight.value), "forkHeight")};
  if(d.forkParent) {if (d.forkParent.value != "-Select Fork Parent-") {addToInsert(d.forkParent.value, "forkParent")}};
  if(d.hashAlgorithm) {addToInsert(d.hashAlgorithm.value, "hashAlgorithm")};
  if(d.ICOfundsRaised) {if (d.ICOfundsRaised.value) {addToInsert(parseInt(d.ICOfundsRaised.value), "ICOfundsRaised")}};
  if(d.icocurrency){if (d.icocurrency.value != "----") {addToInsert(d.icocurrency.value, "icocurrency")}};
  if(d.ICOcoinsProduced) {if(d.ICOcoinsProduced.value) {addToInsert(parseInt(d.ICOcoinsProduced.value), "ICOcoinsProduced")}};
  if(d.ICOcoinsIntended) {if(d.ICOcoinsIntended.value) {addToInsert(parseInt(d.ICOcoinsIntended.value), "ICOcoinsIntended")}};
  if(d.ICOyear) {if (d.ICOyear.value) {addToInsert(Date.parse(new Date(Date.UTC(d.ICOyear.value, d.ICOmonth.value - 1, d.ICOday.value, d.ICOhour.value, d.ICOminute.value, d.ICOsecond.value))), "ICOnextRound")}};
  if(d.genesisYear) {addToInsert(Date.parse(d.genesisYear.value + "-" + d.genesisMonth.value + "-" + d.genesisDay.value), "genesisTimestamp")};
  //if(!insert.genesisTimestamp) {insert.genesisTimestamp = 0};

    data.preventDefault(); //this goes after the 'insert' array is built, strange things happen when it's used too early
    console.log(insert);
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
   return FormData.findOne({name: Template.instance().consensusType.get()}, {}).subsecurity;
  },
  coinExists () {
    return Template.instance().coinExists.get()
  },

  icoText () {
    if (Template.instance().coinExists.get()) {
        return "Funds were raised prior to the genesis block being mined (ICO)"
    } else {
        return "This is planned as an ICO"
    }},
  btcForkText () {
    if (Template.instance().coinExists.get()) {
        return "This was a fork of the Bitcoin blockchain"
    } else {
        return "This is a planned fork of the Bitcoin blockchain"
    }}

  });

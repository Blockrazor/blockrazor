import { Template } from 'meteor/templating';
import { developmentValidationEnabledFalse, FormData, Bounties, RatingsTemplates, HashAlgorithm } from '/imports/api/indexDB.js'; //database

import swal from 'sweetalert';
import Cookies from 'js-cookie';

import './addCoin.html'
import './addCoin.scss'

function initPopOvers(){
  //gotta set a small delay as dom isn't ready straight away
      Meteor.setTimeout(function() {
        $('[data-toggle="popover"]').popover({ trigger: 'focus' })
    }.bind(this), 500);
}

const initDatePicker = function(id, format, template, klass) {
	Meteor.setTimeout(function() {
		$('#' + id).combodate({
			format: format,
			template: template,
			customClass: klass + ' form-control',
			maxYear: 2020,
			minYear: 2008,
			firstItem: 'name'
		});
	}.bind(this), 200)
}

// convert a string of integers into an array of integers
function stringListToInt(stringList, delimiter) {
	return stringList.split(delimiter).map(Number);
}

// convert ICODate into an Array Date
// purpose of this is to have it easily supported by Date.UTC
const formatICODate = function(dateString) {
	var dateArr = dateString.split(" ");
	var date = stringListToInt(dateArr[0], "-");
	var time = stringListToInt(dateArr[1], ":");;
	date[1] = date[1] - 1;
	return date.concat(time);

}

export { initDatePicker, formatICODate }

Template.addCoin.onRendered(function() {
    //init popovers
    $('[data-toggle="popover"]').popover({ trigger: 'focus' })

	// init genesis and ico date pickers
	initDatePicker('genesisDate', 'YYYY-MM-DD', 'YYYY MM D', 'genesis-date');
	initDatePicker('icoDate', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
  initDatePicker('icoDateEnd', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
});

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
  this.powselect = new ReactiveVar(false)
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
  this.blockTime = new ReactiveVar(false)
  this.confirmations = new ReactiveVar(false)
  this.previousNames = new ReactiveVar(false)
  this.exchanges = new ReactiveVar(false)
  this.showAlgoField = new ReactiveVar(false)

  this.currencyNameMessage = new ReactiveVar(null)
  this.consensusType = new ReactiveVar('')

  this.autorun(() => {
    SubsCache.subscribe('currencyBounty')
    SubsCache.subscribe('addCoinQuestions')
    SubsCache.subscribe('hashalgorithm')
    SubsCache.subscribe('formdata')
  })

  this.now = new ReactiveVar(Date.now())
  Meteor.setInterval(() => {
      this.now.set(Date.now())
  }, 1000)
})

//Events
Template.addCoin.events({
  'click #js-nothere': (event, templateInstance) => {
    event.preventDefault()

    templateInstance.showAlgoField.set(!templateInstance.showAlgoField.get())
  },
  'blur #currencyName': function(e, templateInstance){
    templateInstance.currencyName.set(false);
    Meteor.call('isCurrencyNameUnique', e.currentTarget.value);
    Meteor.call('isCurrencyNameUnique', e.currentTarget.value, function(error, result){
      if(error) {templateInstance.currencyNameMessage.set(error.error)} else {templateInstance.currencyNameMessage.set(null)};

    });
    },

//Select form elements to display to user based on their selection
  'change .isICO': function(dataFromForm) {
    Template.instance().isICO.set(dataFromForm.target.checked);
    //init popovers again, can't init on hidden dom elements
     initPopOvers();
	 initDatePicker('genesisDate', 'YYYY-MM-DD', 'YYYY MM D', 'genesis-date');
	 initDatePicker('icoDate', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
  initDatePicker('icoDateEnd', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
  },
  'change .btcfork': function(dataFromForm) {
    Template.instance().btcfork.set(dataFromForm.target.checked);

    //init popovers again, can't init on hidden dom elements
     initPopOvers();
	 initDatePicker('genesisDate', 'YYYY-MM-DD', 'YYYY MM D', 'genesis-date');
	 initDatePicker('icoDate', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
  initDatePicker('icoDateEnd', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');


  },
  'change .exists': function(dataFromForm) {
    Template.instance().coinExists.set(dataFromForm.target.checked);
        //init popovers again, can't init on hidden dom elements
     initPopOvers();

	 // init genesis and ico date pickers again
	 initDatePicker('genesisDate', 'YYYY-MM-DD', 'YYYY MM D', 'genesis-date');
	 initDatePicker('icoDate', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
  initDatePicker('icoDateEnd', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');


  },
  'change #consensusType': function(consensusType) {
    Template.instance().consensusType.set(consensusType.target.value);
         //init popovers again, can't init on hidden dom elements
     initPopOvers()

     Template.instance().powselect.set(consensusType.target.value !== '--Select One--')
  },
  'change #currencyLogoInput': function(event){

  var mime = require('mime-types')
  var instance = this;
  var file = event.target.files[0];
  var uploadError = false;
  var mimetype = mime.lookup(file);
  var fileExtension = mime.extension(file.type);

if(file){
  //check if filesize of image exceeds the global limit
  if (file.size > _coinFileSizeLimit) {
                swal({
                    icon: "error",
                    text: "Image must be under 2mb",
                    button: { className: 'btn btn-primary' }
                });
      uploadError = true;
  }

 if (!_supportedFileTypes.includes(file.type)) {
     swal({
         icon: "error",
         text: "File must be an image",
         button: { className: 'btn btn-primary' }
     });
     uploadError = true;
 }

//Only upload if above validation are true
//Disabled validation in development environment for easy testing (adjust in both startup index)
if(developmentValidationEnabledFalse && !uploadError){

  $("#fileUploadValue").html("<i class='fa fa-circle-o-notch fa-spin'></i> Uploading");


   var reader = new FileReader();
   reader.onload = function(fileLoadEvent){
     //var binary = event.target.result;
     var binary = reader.result;
     var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();

     Meteor.call('uploadCoinImage', file.name, event.target.id, instance._id, reader.result,md5, function(error, result){
       if(error){
        console.log(error)
         swal({
         icon: "error",
         text: error.message,
         button: { className: 'btn btn-primary' }
     });
       }else{

    $("#currencyLogoFilename").val(md5+'.'+fileExtension);

       $("#fileUploadValue").html("Change");
       $("#currencyLogoInputLabel").removeClass('btn-primary');
       $("#currencyLogoInputLabel").addClass('btn-success');

       }

     });
   }
   reader.readAsBinaryString(file);
 }
 }
},

  'click #cancel': function(data) {
    console.log(data);
    Meteor.call('deleteNewBountyClient', 'new-currency', (err, data) => {})
    Cookies.set('workingBounty', false, { expires: 1 })
    FlowRouter.go('/');
  },
  'submit form': function(data){
    data.preventDefault(); //is technically not suppose to be here as per comment #1, note return false in existence check
  var insert = {}; //clear insert dataset

  if (Template.instance().currencyNameMessage.get() != null){ //pending/existing check
    sAlert.error(Template.instance().currencyNameMessage.get())
    return false
  }
  var d = data.target;
  launchTags = new Array();
    if (d.ICO.checked) {launchTags.push({"tag": "ICO"})};
    if (d.BTCFork.checked) {launchTags.push({"tag": "Bitcoin Fork"})};
    if (!d.BTCFork.checked) {launchTags.push({"tag": "Altcoin"})};
    if(!d.exists.checked) {launchTags.push({"tag": "proposal"})}

      let questions = []

    RatingsTemplates.find({}).fetch().forEach(i => {
      questions.push({
        questionId: i._id,
        category: i.catagory,
        negative: i.negative,
        value: $(`input[name="question_${i._id}"]:checked`).val()
      })
    })

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].value) {
        sAlert.error('Please answer all additional questions.')

        return
      }
    }

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
    approvalNotes: d.notes.value,
    currencyLogoFilename: d.currencyLogoFilename.value,
  }

  if (questions.length) {
    insert['questions'] = questions
  }

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
  if(d.genesisYear) {addToInsert(Date.parse(d.genesisYear.value), "genesisTimestamp")};
  if(d.ICOyear) {
	  if (d.ICOyear.value) {
		  var icoDate = formatICODate(d.ICOyear.value);
      var icoDateEnd = formatICODate(d.icoDateEnd.value);
		  addToInsert(Date.parse(new Date(Date.UTC(icoDate[0], icoDate[1], icoDate[2], icoDate[3], icoDate[4], icoDate[5]))), "ICOnextRound")
      addToInsert(Date.parse(new Date(Date.UTC(icoDateEnd[0], icoDateEnd[1], icoDateEnd[2], icoDateEnd[3], icoDateEnd[4], icoDateEnd[5]))), "icoDateEnd")

	  }
  };
  //if(!insert.genesisTimestamp) {insert.genesisTimestamp = 0};

    data.preventDefault(); //this goes after the 'insert' array is built, strange things happen when it's used too early; #1
    console.log(insert);
//Send everything to the server for fuckery prevention and database insertion
    Meteor.call('addCoin', insert, function(error, result){
      //remove error classes before validating
      $('input').removeClass('is-invalid');

      if(error) {
        // turn error into user friendly string
             swal({
                 icon: "error",
                  title: "Please fix the following fields",
                 text: error.error.map(i => i.split(/(?=[A-Z])/).join(' ').toLowerCase()).join(', '),
                 button: { className: 'btn btn-primary' }
             });

       // sAlert.error(`You need to fix the following fields to continue: ${error.error.map(i => i.split(/(?=[A-Z])/).join(' ').toLowerCase()).join(', ')}.`)
      } else {
        Meteor.call('completeNewBounty', 'new-currency', $('#currencyName').val(), (err, data) => {})
        Cookies.set('workingBounty', false, { expires: 1 })
        FlowRouter.go('/mypending');
      }
    });
      }
});



Template.addCoin.helpers({
  getPopoverContent (val){

switch (val) {
    case "currencyName":
        {
            return 'Please input the name of the cryptocurrency, token, ICO, etc.';
            break;
        }
    case "currencySymbol":
        {
            return "Please input the symbol for this currency."
            break;
        }
    case "ICOfundsRaised":
        {
            return "How much was raised in total, including all rounds and pre-sales etc?"
            break;
        }
    case "genesisTimestamp":
        {
            return "When was the genesis block mined? The easiest way to check this is to seach on Google for a block explorer for this blockchain and go to block 0. In most block explorers you can simply type \"0\" into their search feature and it will find the genesis block. In some cases, the genesis block may have a unix timestamp of \"0\" which translates to 1st January 1970. In those cases, simply use block 1 instead."
            break;
        }
    case "intendedLaunch":
        {
            return "When do the people behind this coin intend to mine the genesis block or launch the coin?"
            break;
        }
    case "forkParent":
        {
            return "  Please select which Bitcoin blockchain this fork is forking from. For example if it is a fork of Bitcoin Cash, simply choose \"Bitcoin Cash\"."
            break;
        }
    case "forkHeight":
        {
            return "At which block did (or will) the fork happen?"
            break;
        }
    case "premine":
        {
            return "Were coins sold or distributed before the public were able to participate in mining? Did the developers mine coins before telling anyone else about it? This is more of a \"if it quacks like a duck it's probably a duck\" question. For example Zcash has a 20% mining tax until the developers recieve 2,100,000 coins, thus their premine is 2100000."
            break;
        }
    case "maxCoins":
        {
            return "Is there a cap on the total number of coins produced? For example, Bitcoin is 21,000,000. If there's no cap. or if there's an inflationary tail, please input the total coins that will exist in the year 2050."
            break;
        }
    case "gitRepo":
        {
            return "    This is the git code repository for the main node software (not the github organization). For example, Monero is https://github.com/monero-project/monero"
            break;
        }
    case "officialSite":
        {
            return "What is the offical website?"
            break;
        }
    case "reddit":
        {
            return "Is there a reddit page (subreddit) for this project?"
            break;
        }
    case "blockTime":
        {
            return "What is the block time for this blockchain?"
            break;
        }

    case "confirmations":
        {
            return "How many confirmations do exchanges wait for before they let you trade it if you deposit this currency? Not all exchanges are the same, but any number you've experienced yourself is fine."
            break;
        }

    case "previousNames":
        {
            return "Has this currency been known by any previous names?"
            break;
        }

    case "exchanges":
        {
            return "Which exchanges have listed this currency? Some examples include: Bittrex, Poloniex, Kraken"
            break;
        }

}

  },
  questions: () => RatingsTemplates.find({}).fetch(),
  activeBounty: () => {
    let bounty = Bounties.find({
      userId: Meteor.userId(),
      type: 'new-currency',
      completed: false
    }, {
      sort: {
        expiresAt: -1
      }
    }).fetch()[0]

    return bounty && bounty.expiresAt > Date.now()
  },
  timeRemaining: () => {
    let bounty = Bounties.find({
      userId: Meteor.userId(),
      type: 'new-currency',
      completed: false
    }, {
      sort: {
        expiresAt: -1
      }
    }).fetch()[0]

    return `You have ${Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60)} minutes to complete the bounty for ${Number(bounty.currentReward).toFixed(2)} KZR.`;
  },
  security () {
    return FormData.find({}, {});
  },
  subsecurity () {
    if (Template.instance().consensusType.get() === 'Proof of Work') {
      return HashAlgorithm.find({
        $or: [{
          type: 'pow' 
        }, {
          type: {
            $exists: false // previous data doesn't have this field, so we have to check
          }
        }]
      }).fetch()
    } else if (Template.instance().consensusType.get() === 'Proof of Stake') {
      return HashAlgorithm.find({
        type: 'pos'
      }).fetch()
    } else if (Template.instance().consensusType.get() === 'Hybrid') {
      return HashAlgorithm.find({}).fetch().map(i => { // list all here
        i.name = `Staking and ${i.name}`

        return i
      })
    }

    return []
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
    }},
    showAlgoField: () => Template.instance().showAlgoField.get()

  });

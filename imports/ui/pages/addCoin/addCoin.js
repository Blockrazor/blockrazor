import { Template } from 'meteor/templating';
import { developmentValidationEnabledFalse, FormData, Bounties, RatingsTemplates, HashAlgorithm, Exchanges, Currencies } from '/imports/api/indexDB.js'; //database
import { addCoin } from '/imports/api/coins/methods'
import('sweetalert2').then(swal => window.swal = swal.default)

import Cookies from 'js-cookie';
import smartWizard from 'smartwizard';

import '/imports/ui/components/typeahead'

import './addCoin.html'
import './addCoin.scss'
import './smart.wizard.custom.css'

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
  let self = this
  const instance = Template.instance();
  //extra finish button not available out the box.
  var btnFinish = $('<button id="btnFinish"></button>').text('Finish')
    .addClass('btn btn-primary d-none')
    .on('click', function (event) {
      // event.preventDefault()
    });

  Meteor.setTimeout(() => {
    instance.$("#premine,#maxCoins").on("input", function () {
      this.value = this.value.slice(0, this.maxLength);
    });
  }, 0);




  // Smart Wizard Init.. fairly OOTB except the finish button I added.
  $('#smartwizard').smartWizard({
    selected: 0,
    theme: 'default',
    transitionEffect: 'fade',
    showStepURLhash: true,
    toolbarSettings: {
      toolbarPosition: 'top',
      toolbarButtonPosition: 'end',
      toolbarExtraButtons: [btnFinish]
    }
  })

            //Smart Wizard function to watch what step we are on. All I have done atm is catch the final
            // step to enable the finish button.
            $("#smartwizard").on("showStep", function(e, anchorObject, stepNumber, stepDirection, stepPosition) {
                if (stepPosition === 'first') {
                    $("#prev-btn").addClass('disabled');
                } else if (stepPosition === 'final') {
                    $("#next-btn").addClass('disabled');
                    $("#btnFinish").removeClass('d-none');
                }
            });

            $("#smartwizard").on("leaveStep", function(anchorObject, context, stepNumber, stepDirection) {
              if (stepDirection == 'forward') {
                return validateStep(stepNumber, self);
              }
            });

    //init popovers
    $('[data-toggle="popover"]').popover({ trigger: 'focus' })

  // init genesis and ico date pickers
  initDatePicker('genesisDate', 'YYYY-MM-DD', 'YYYY MM D', 'genesis-date');
  initDatePicker('icoDate', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');
  initDatePicker('icoDateEnd', 'YYYY-MM-DD HH:mm:ss', 'YYYY MM DD HH mm ss', 'ico-date');

  //autopopulates fields for validation testing
  if (Meteor.isDevelopment && developmentValidationEnabledFalse){
    $("#currencyName")[0].value = "sdfsdf"
    $("#currencySymbol")[0].value = "sdf"
     $("#premine")[0].value = 4444
     $("#maxCoins")[0].value = 44444
     Meteor.setTimeout(()=>{
      $(".month").val("1").change()
      $(".year").val("2017").change()
      $(".day").val("1").change()
     }, 500)
     Meteor.setTimeout(()=>{
      $("#consensusSecurity").val("Hybrid").change()
      $("#exampleFormControlSelect1")[0].value = "7be44dviDMiuoShan"
    }, 600)
    Meteor.setTimeout(()=>{
      $("#exampleFormControlSelect1")[0].value = "7be44dviDMiuoShan"
    }, 1000)
  }



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

// building the context from the bottom
let currentContext = {}

/*
validate inputs takes an array of inputs and checks them all individually
array elements can be either strings (default type) or objects
object supports the following fields: 
  {
    type: String ('custom'|''),
    name: String,
    customValue: Any,
    customValidation: Function ((error, success) => {})
  }
*/

var validateInputs = (inputs) => {
  let isValid = true

  inputs.forEach(input => {
    let error
    let val
    let custom = false
    let customVal

    if (typeof input === 'object') {
      if (input.type === 'custom') {
        val = input.customValue 

        custom = true
      }

      if (typeof input.customValidation === 'function') {
        customVal = input.customValidation
      }

      input = input.name
    }

    if (!custom) {
      let type = ((Currencies.newCoinSchema._schema[input].type || {}).singleType || '')

      if (type === Boolean) {
        val = $(`#${input}`).is(':checked')
      } else if (type === Number || type === 'SimpleSchema.Integer') {
        val = Number($(`#${input}`).val())
      }

      val = $(`#${input}`).val()
    }

    try {
      let posContext = _.extend(currentContext, {
        [input]: val
      })
      Currencies.newCoinSchema.validate(Currencies.newCoinSchema.clean(posContext), {
        keys: [input],
        extendedCustomContext: currentContext
      })
    } catch(e) {
      isValid = false

      error = e.message

      console.log(error)
    }

    if (isValid && ($(`#${input}`).is(':visible') || input === 'currencyLogoFilename' || custom)) {
      currentContext[input] = val
    } else {
      delete currentContext[input]
    }

    if ($(`#${input}`).is(':visible') && !isValid) {
      if (!customVal) {
        $(`#${input}`).addClass('danger-outline')
        $(`#${input}`).next().show().text(error)
      } else {
        customVal(error, false)
      }
    } else {
      if (!customVal) {
        $(`#${input}`).removeClass('danger-outline')
        $(`#${input}`).next().hide()
      } else {
        customVal(null, true)
      }
    }
  })

  return isValid
}

var validateStep = function(step, templ) {
  isValid = true

  if (!developmentValidationEnabledFalse) { // skip validation on dev
    return true
  }

  switch(step) {
    case 0:
      let launchTags = []

      if ($('#is-ico').is(':checked')) {
        launchTags.push({
          'tag': 'ICO'
        })
      }
      if ($('#smartContract').is(':checked')) {
        launchTags.push({
          'tag': 'Smart Contract'
        })
      } else {
        if ($('#btc-fork').is(':checked')) {
          launchTags.push({
            'tag': 'Bitcoin Fork'
          })
        } else {
          launchTags.push({
            'tag': 'Altcoin'
          })
        }
      }
      if ($('#bc-launched').is(':checked')) {
        launchTags.push({
          'tag': 'proposal'
        })
      }

      currentContext['launchTags'] = launchTags // set the context
    break;
    case 1:
      let ico = {}
      if ($('#icoDate').val()) {
        let icoDate = formatICODate($('#icoDate').val())

        ico['nextRound'] = (Date.parse(new Date(Date.UTC(icoDate[0], icoDate[1], icoDate[2], icoDate[3], icoDate[4], icoDate[5]))))
      }

      if ($('#icoDateEnd').val()) {
        let icoDateEnd = formatICODate($('#icoDateEnd').val())

        ico['dateEnd'] = (Date.parse(new Date(Date.UTC(icoDateEnd[0], icoDateEnd[1], icoDateEnd[2], icoDateEnd[3], icoDateEnd[4], icoDateEnd[5]))))
      }

      return validateInputs(['currencyName', 'currencySymbol', 'consensusSecurity', 'hashAlgorithm', 'ICOcoinsIntended', {
        name: 'ICOnextRound',
        customValue: ico['nextRound'],
        type: 'custom'
      }, {
        name: 'icoDateEnd',
        customValue: ico['dateEnd'],
        type: 'custom'
      }, 'icocurrency', 'ICOfundsRaised', 'ICOcoinsProduced', 'replayProtection'])
    break;
    case 2:
      return validateInputs(['maxCoins', 'premine', 'forkParent', 'forkHeight', {
        name: 'genesisTimestamp',
        type: 'custom',
        customValue: Date.parse($('#genesisDate').val())
      }])
    break;
    case 3:
      return validateInputs(['gitRepo', 'officialSite', 'reddit', 'blockExplorer', 'smartContractURL', {
        name: 'previousNames',
        type: 'custom',
        customValue: makeTagArrayFrom($('#previousNames').val(), 'tag')
      }, {
        name: 'exchanges',
        type: 'custom',
        customValue: templ.exchanges.get()
      }])
    break;
    case 4:
      return validateInputs(['currencyLogoFilename', {
        name: 'approvalNotes',
        type: 'custom',
        customValue: $('#notes').val()
      }])
    break;
  }
}

Template.addCoin.onCreated(function() {
  this.coinExists = new ReactiveVar(true)
  this.smartContract = new ReactiveVar(false)
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
  this.consensusSecurity = new ReactiveVar('')

  //for typeahead
  this.exchanges = new ReactiveVar([])

  this.autorun(() => {
    SubsCache.subscribe('currencyBounty')
    SubsCache.subscribe('addCoinQuestions')
    SubsCache.subscribe('hashalgorithm')
    SubsCache.subscribe('formdata')
    SubsCache.subscribe('exchanges')
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
    'change #smartContract': function(dataFromForm) {
    Template.instance().smartContract.set(dataFromForm.target.checked);
  },

  'change #consensusSecurity': function(consensusSecurity) {
    Template.instance().consensusSecurity.set(consensusSecurity.target.value);
         //init popovers again, can't init on hidden dom elements
     initPopOvers()

     Template.instance().powselect.set(consensusSecurity.target.value !== '--Select One--')
  },
  'change #currencyLogoInput': function(event){
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
                    text: TAPi18n.__('coin.too_big'),
                    button: { className: 'btn btn-primary' }
                });
      uploadError = true;
  }

 if (!_supportedFileTypes.includes(file.type)) {
     swal({
         icon: "error",
         text: TAPi18n.__('coin.must_be_image'),
         button: { className: 'btn btn-primary' }
     });
     uploadError = true;
 }

//Only upload if above validation are true
//Disabled validation in development environment for easy testing (adjust in both startup index)
if(!uploadError){

  $("#fileUploadValue").html(`<i class='fa fa-circle-o-notch fa-spin'></i> ${TAPi18n.__('coin.uploading')}`);


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

      $("#fileUploadValue").html(TAPi18n.__('coin.change'));
      $("#currencyLogoInputLabel").removeClass('btn-primary');

       //hide invalid validation if it exists
      $("#currencyLogoInputLabel").removeClass('btn-danger');
      $("#currencyLogoInputInvalid").hide();
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
  'click .remove-exchange': function (event) {
    let selectedExchangeId = $(event["target"]).data("id")
    let exchanges = Template.instance().exchanges.get()
    if (exchanges.length > 0){
      exchanges.some(function(exchange, index){
        if(exchange._id === selectedExchangeId) {
          exchanges.splice(index, 1)
          return true   // breaks loop iteration
        }
      })
      Template.instance().exchanges.set(exchanges)
    }
  },
  'submit form': function (data) {
    data.preventDefault(); //is technically not suppose to be here as per comment #1, note return false in existence check

    if (!validateStep(4, self)) {
      return
    }
    
    if (Template.instance().currencyNameMessage.get() != null) { //pending/existing check
      sAlert.error(Template.instance().currencyNameMessage.get()) // needs UI fixing
      return false
    }

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
        sAlert.error(TAPi18n.__('coin.answer_questions')) // needs UI fixing
        return
      }
    }

    if (questions.length) {
      currentContext['questions'] = questions
    }

    addCoin.call(currentContext, (error, result)=> {
      //remove error classes before validating
      $('input').removeClass('is-invalid')
      $('select').removeClass('is-invalid')
      
      if (error) {
        error.details.forEach((data) => {
          console.log(data)
          //dyanmicly populate the error message and flag fields as invalid based on simpleSchema validation
          $(`#${data.name}`).addClass('is-invalid')
          $(`#${data.name}`).next('.invalid-feedback').html(data.message)

          //some fields in the dom don't match one to one, so a bit of manual work is required :(
          if (data.name === 'genesisTimestamp') {
            $('.genesis-date').addClass('is-invalid')
            $('#genesisDateInvalid').html(data.message)
          }

          if (data.name === 'currencyLogoFilename') {
            $('#currencyLogoInputLabel').addClass('is-invalid btn-danger')
            $('#currencyLogoFilenameInvalid').show()
            $('#currencyLogoFilenameInvalid').html(data.message)

            //Scroll to the dom element which has caused the error, no point staying at the bottom.
            //its -100 was we want it to scroll above the input so we can see the label
            $('html, body').animate({
                scrollTop: $(".is-invalid:first").offset().top-100
            }, 1000)
          }
        })
      } else {
        currentContext = {}

        Meteor.call('completeNewBounty', 'new-currency', $('#currencyName').val(), (err, data) => {})
        Cookies.set('workingBounty', false, {
          expires: 1
        })
        FlowRouter.go('/mypending')
      }
    })
  }
})

Template.addCoin.helpers({
  getPopoverContent (val){

switch (val) {
    case "currencyName":
        {
            return TAPi18n.__('coin.currency_name_info');
            break;
        }
    case "currencySymbol":
        {
            return TAPi18n.__('coin.currency_symbol_info')
            break;
        }
    case "ICOfundsRaised":
        {
            return TAPi18n.__('coin.ico_info')
            break;
        }
    case "genesisTimestamp":
        {
            return TAPi18n.__('coin.genesis_info')
            break;
        }
    case "intendedLaunch":
        {
            return TAPi18n.__('coin.launch_info')
            break;
        }
    case "forkParent":
        {
            return TAPi18n.__('coin.fork_info')
            break;
        }
    case "forkHeight":
        {
            return TAPi18n.__('coin.fork_height_info')
            break;
        }
    case "premine":
        {
            return TAPi18n.__('coin.premine_info')
            break;
        }
    case "maxCoins":
        {
            return TAPi18n.__('coin.max_info')
            break;
        }
    case "gitRepo":
        {
            return TAPi18n.__('coin.git_info')
            break;
        }
    case "officialSite":
        {
            return TAPi18n.__('coin.website_info')
            break;
        }
    case "reddit":
        {
            return TAPi18n.__('coin.reddit_info')
            break;
        }
    case "blockTime":
        {
            return TAPi18n.__('coin.block_info')
            break;
        }

    case "confirmations":
        {
            return TAPi18n.__('coin.confirm_info')
            break;
        }

    case "previousNames":
        {
            return TAPi18n.__('coin.prev_info')
            break;
        }

    case "exchanges":
        {
            return TAPi18n.__('coin.exchange_info')
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

    return TAPi18n.__('coin.time_remaining', {
      postProcess: 'sprintf',
      sprintf: [Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60), Number(bounty.currentReward).toFixed(2)]
    })
  },
  security () {
    return FormData.find({}, {});
  },
  subsecurity () {
    if (Template.instance().consensusSecurity.get() === 'Proof of Work') {
      return HashAlgorithm.find({
        $or: [{
          type: 'pow'
        }, {
          type: {
            $exists: false // previous data doesn't have this field, so we have to check
          }
        }]
      }).fetch()
    } else if (Template.instance().consensusSecurity.get() === 'Proof of Stake') {
      return HashAlgorithm.find({
        type: 'pos'
      }).fetch()
    } else if (Template.instance().consensusSecurity.get() === 'Hybrid') {
      return HashAlgorithm.find({
        $or: [{
          type: 'pow'
        }, {
          type: {
            $exists: false // previous data doesn't have this field, so we have to check
          }
        }]
      }).fetch().map(i => { // list all here
        i.name = `Staking and ${i.name}`

        return i
      })
    }

    return []
  },
  coinExists () {
    return Template.instance().coinExists.get()
  },
  smartContract () {
    return Template.instance().smartContract.get()
  },
  icoText () {
    if (Template.instance().coinExists.get()) {
        return TAPi18n.__('coin.funds_raised_prior')
    } else {
        return TAPi18n.__('coin.planned_ico')
    }},
  btcForkText () {
    if (Template.instance().coinExists.get()) {
        return TAPi18n.__('coin.btc_fork')
    } else {
        return TAPi18n.__('coin.planned_fork')
    }},
  showAlgoField: () => Template.instance().showAlgoField.get(),
  typeaheadProps: function () {
    return {
      limit: 15,
      query: function (templ, entry) {
          return {
            name: {
              $nin: templ.exchanges.get().map(x=>x.name),
              $regex: new RegExp(entry, 'ig')
            }
          }
      },
      projection: function (templ, entry) {
        return {
          limit: 15,
          sort: {
            name: 1
          }
        }
      },
      add: function (event, data, templ) {
        if (data._id) {
          var exchanges = templ.exchanges.get()
          exchanges.push(data)
          templ.exchanges.set(exchanges)
        }
      },
      create: function (event, input, templ) {
        Meteor.call("addExchange", input, (error, result) => {
          if (!error && result) {
            sAlert.success(TAPi18n.__('coin.exchange_created'))

            if (result._id) {
              let exchanges = templ.exchanges.get()
              exchanges.push(result)
              templ.exchanges.set(exchanges)
            }
          } else {
            sAlert.error(TAPi18n.__('coin.exchange_exists'))
          }
        })
      },
      col: Exchanges, //collection to use
      template: Template.instance(), //parent template instance
      focus: false,
      transcient: true,
      autoFocus: true,
      quickEnter: true,
      displayField: "name", //field that appears in typeahead select menu
      placeholder: TAPi18n.__('coin.add_exchange'),
      results: Template.instance().typeAheadRes,
      value: Template.instance().typeAheadValue,
      addButtonText: TAPi18n.__('coin.create_exchange'),
      customAddButtonExists: false,
    }
  },
  exchanges(){
    return Template.instance().exchanges.get()
  }
});

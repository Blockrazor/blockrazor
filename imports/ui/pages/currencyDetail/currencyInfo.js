import {
  Template
} from 'meteor/templating'
import {
  HashAlgorithm,
  FormData,
  Currencies,
  Exchanges,
} from '/imports/api/indexDB.js'

import { 
  editCoin
} from '/imports/api/coins/methods' 

import './currencyInfo.html'
import './currencyInfo.scss'
import '/imports/ui/components/typeahead'
import('sweetalert2').then(swal => window.swal = swal.default)

Template.currencyInfo.onCreated(function () {
  this.autorun(() => {
    SubsCache.subscribe('exchanges')
  })
  this.newAlgo = new ReactiveVar(false)
  this.showText = new ReactiveVar(false)

  //for typeahead
  this.currency = Template.currentData()
  this.exchangesNames = new ReactiveVar([])
  this.autorun(() => {
    var exchanges = Template.currentData().exchanges
    if (exchanges) {
      this.exchangesNames.set(exchanges.map(x => {
        return x.name
      }))
    }
  })

    this.reposShow = new ReactiveVar(9)
})

Template.currencyInfo.onRendered(function () {
  $('[data-toggle="tooltip"]').tooltip()
  const self = this

  $.fn.editable.defaults.mode = 'inline' // display them inline
  $.fn.editableform.buttons = `<button type="submit" class="btn btn-primary btn-sm editable-submit"><i class="fa fa-check"></i></button><button type="button" class="btn btn-default btn-sm editable-cancel"><i class="fa fa-times"></i></button>` // custom buttons with fa icons

  // editable fields
  let editables = ['currencyName', 'currencySymbol', 'gitRepo', 'officialSite', 'previousNames','smartContractURL']

  const validate = function (val) { // the actual proposing part
    if ($(this).attr('id') === 'genesisTimestamp') {
      val = new Date(val).getTime()
    }

    if ($(this).attr('id') === 'hashAlgorithm') {
      let algo = HashAlgorithm.findOne({
        _id: val
      })

      val = algo ? algo.name : val

      self.showText.set(false) // hide the tooltip
    }

    if ($(this).text() !== val) {

      $('#coinChangeModal').modal();


      $('#from').html($(this).text());
      $('#to').html(val);
      $('#forField').html($(this).attr('id'))

      $('#modal_field').val($(this).attr('id'));
      $('#modal_old').val($(this).text());
      $('#modal_new').val(val);

      return ''
    }

    return TAPi18n.__('currency.info.change_data')
  }

  editables.forEach(i => $(`#${i}`).editable({
    validate: validate
  }))

  $('#premine').editable({
    type: 'number',
    validate: validate
  });
  $('#maxCoins').editable({
    type: 'number',
    validate: validate
  });
  
  $('#genesisTimestamp').editable({
    validate: validate,
    type: 'combodate',
    format: 'DD/MM/YYYY',
    template: 'DD / MM / YYYY',
    combodate: {
      minYear: 2009,
      maxYear: new Date().getUTCFullYear(),
      smartDays: true
    }
  })

  $('#consensusSecurity').editable({
    validate: validate,
    type: 'select',
    source: () => {
      return FormData.find({}).fetch().map(i => ({
        text: i.name,
        value: i.name
      }))
    }
  })

  $('#hashAlgorithm').editable({
    validate: validate,
    type: 'select', // only show select for these two
    source: () => {
      if ($('#consensusSecurity').text() === 'Proof of Work') {
        return HashAlgorithm.find({
          $or: [{
            type: 'pow'
          }, {
            type: {
              $exists: false // previous data doesn't have this field, so we have to check
            }
          }]
        }).fetch().map(i => ({
          text: i.name,
          value: i._id
        }))
      } else if ($('#consensusSecurity').text() === 'Proof of Stake') {
        return HashAlgorithm.find({
          type: 'pos'
        }).fetch().map(i => ({
          text: i.name,
          value: i._id
        }))
      } else if ($('#consensusSecurity').text() === 'Hybrid') {
        return HashAlgorithm.find({}).fetch().map(i => {
          i.name = `Staking and ${i.name}`

          return {
            text: i.name,
            value: i._id
          }
        })
      }

      return []
    }
  })
});

Template.currencyInfo.events({
  'error img': function (e) {
    // fires when a particular image doesn't exist in given path
    if ($(e.target).attr('src') !== '/codebase_images/noimage.png') {
      $(e.target).attr('src', '/codebase_images/noimage.png')
    }
  },
  'click .editable-click': (event, templateInstance) => {
    if ($(event.currentTarget).attr('id') === 'hashAlgorithm') {
      templateInstance.showText.set(!templateInstance.showText.get())
    }
  },
  'click #js-addAlgo': (event, templateInstance) => {
    event.preventDefault()

    Meteor.call('addAlgo', $('#js-newAlgo').val(), $('#consensusSecurity').text().toLowerCase().split(' ').reduce((i1, i2) => i1 + i2[0], ''), (err, data) => {
      if (data) {
        $('.editable-input').find('select').val(data) // set the selected item to the newly added algorithm
      }
    })

    templateInstance.newAlgo.set(false)
    templateInstance.showText.set(false)
  },
  'click #js-add': (event, templateInstance) => {
    event.preventDefault()

    templateInstance.newAlgo.set(true)
    templateInstance.showText.set(false)
  },
  'click #js-cancel': (event, templateInstance) => {
    event.preventDefault()

    templateInstance.newAlgo.set(false)
    templateInstance.showText.set(true)
  },
  'change #currencyLogoInput': function (event) {
    var instance = this;
    var file = event.target.files[0];
    var uploadError = false;
    var mimetype = mime.lookup(file);
    var fileExtension = mime.extension(file.type);

    if (file) {
      //check if filesize of image exceeds the global limit
      if (file.size > _coinFileSizeLimit) {
        swal({
          icon: "error",
          text: TAPi18n.__('currency.info.image_2m'),
          confirmButtonClass: 'btn btn-primary'
        });
        uploadError = true;
      }

      if (!_supportedFileTypes.includes(file.type)) {
        swal({
          icon: "error",
          text: TAPi18n.__('currency.info.must_be_image'),
          confirmButtonClass: 'btn btn-primary'
        });
        uploadError = true;
      }

      //Only upload if above validation are true
      if (!uploadError) {

        $("#fileUploadValue").html("<i class='fa fa-circle-o-notch fa-spin'></i> Uploading");


        var reader = new FileReader();
        reader.onload = function (fileLoadEvent) {
          //var binary = event.target.result;
          var binary = reader.result;
          var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();

          Meteor.call('changeCoinImage', file.name, event.target.id, instance._id, reader.result, md5, function (error, result) {
            if (error) {
              console.log(error)
              swal({
                icon: "error",
                text: error.message,
                confirmButtonClass: 'btn btn-primary'
              });
            } else {

              $("#currencyLogoFilename").val(md5 + '.' + fileExtension);

              $("#fileUploadValue").html(TAPi18n.__('currency.info.change'));
              $("#currencyLogoInputLabel").removeClass('btn-primary');
              $("#currencyLogoInputLabel").addClass('btn-success');

            }

          });
        }
        reader.readAsBinaryString(file);
      }
    }
  },
  'click .viewExchanges': function (event) {
    $('#exchangesModal').modal('show');
  },

  'click .changeCoinImage': function (event) {
    $('#coinChangeImage').modal('show');


    $('#coinModal_field').val($(this).attr('id'));
  },

  'click #proposeCoinChange': function (event) {


    $('#coinChangeImage').modal('hide');




    editCoin.call({
      coin_id: $('#_id').val(),
      coinName: $('#name').val(),
      changed: {
        ['currencyLogoFilename']: $('#currencyLogoFilename').val()
      },
      old: $('#currencyLogoFilename_existing').val(),
      changedDate: new Date().getTime(),
      createdBy: Meteor.userId(),
      score: 0,
      status: 'pending review',
      notes: $('#currencyNotes').val()
    }, (error, result) => {
      if (error) {
        if (error.details) {
          error.details.forEach(i => {
            sAlert.error(i.message)
          })
        } else {
          sAlert.error(error.error)
        }
      } else {
        console.log('coinChangeModal ran successfully')
        sAlert.success(TAPi18n.__('currency.info.proposed'))
      }
    })


  },


  'click #proposeChange': function (event) {
    //close modal
    $('#coinChangeModal').modal('hide');

    //call method to edit coin

    let type = $('#modal_field').val()
    let val = ~['premine', 'maxCoins', 'genesisTimestamp'].indexOf(type) ? Number($('#modal_new').val()) : $('#modal_new').val()

    editCoin.call({
      coin_id: $('#_id').val(),
      coinName: $('#name').val(),
      changed: {
        [type]: val
      },
      old: $('#modal_old').val(),
      changedDate: new Date().getTime(),
      createdBy: Meteor.userId(),
      score: 0,
      status: 'pending review',
      notes: $('#currencyNotes').val()
    }, (error, result) => {
      if (error) {
        if (error.details) {
          error.details.forEach(i => {
            sAlert.error(i.message)
          })
        } else {
          sAlert.error(error.error)
        }
      } else {
        console.log('yay')
        sAlert.success(TAPi18n.__('currency.info.proposed'))
      }
    })
  },

  // Cancel button on the modal to revert changes
  'click #cancelChange': function (event) {
    event.preventDefault();
    $('#modal_new').val($('#modal_old').val());
    $(`#${$('#modal_field').val()}`).text($('#modal_old').val());
  },
  'click .untagExchange': function (event, templ) {
    Meteor.call("untagExchange", $(event.target).data("id"), templ.currency._id, (err, res) => {
      if (!err) {
        sAlert.success(TAPi18n.__('currency.info.exchange_success') + templ.currency.currencyName)
      } else {
        sAlert.error(TAPi18n.__('currency.info.exchange_problem') + templ.currency.currencyName)
      }
    })
  },
    'click #js-show-more': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.reposShow.set(templateInstance.reposShow.get() + 9)
    }
});

Template.currencyInfo.helpers({
    topLangs: function() {
        return this.gitStats.topLanguages.toString().replace(/,/g, ', ')
    },
    relatedRepos: () => {
        let repos = Template.instance().data.relatedRepos || []

        return repos.sort((i1, i2) => Number(i2.score) - Number(i1.score)).slice(0, Template.instance().reposShow.get())
    },
    formatDate: (val) => {
        return moment(new Date(val)).format(_globalDateFormat)
    },
    reposHasMore: () => Template.instance().reposShow.get() <= Template.instance().data.relatedRepos.length,
  newAlgo: () => Template.instance().newAlgo.get() ? 'block' : 'none',
  showText: () => Template.instance().showText.get() ? 'block' : 'none',
  previousNames: () => {
    return (Template.instance().data.previousNames || []).map(i => i.tag) || 'N\\A'
  },
  truncate(val) {
    if (val.length > 20) {
      return val.substring(0, 20) + '...';
    } else {
      return val;
    }
  },
  isDateNull(val, field) {

    if (typeof val == "number") {
      return moment(val).format(_globalDateFormat);
    } else {
      if (field) {
        return 'N\\A'
      }
    }
  },
  isNullDollar: (val) => {
    return val ? `${val}$` : '-'
  },
  isNull(val) {
    if (val || val === 0) {
      if (typeof val == "string") {
        return val;
      } else if (typeof val == "object") {
        return val.length == 1 ? val[0] : val.join(", ");
      } else if (typeof val == "number") {
        return val;
      }
    } else {
      return 'N\\A'
    }
  },
  isNullReadOnly(val) {
    if (val || val === 0) {
      if (typeof val == "string") {
        return val;
      } else if (typeof val == "object") {
          return val.length == 1 ? val[0] : val.join(", ");
      } else if (typeof val == "number") {
        return val;
      }
    } else {
      return '-'
    }
  },
  hashAlgorithm: function () {
    let prefix = ''
    if (this.consensusSecurity === 'Hybrid') {
      prefix = 'Staking and '
    }

    let algo = HashAlgorithm.findOne({
      _id: this.hashAlgorithm
    })

    return algo ? `${prefix}${algo.name}` : this.hashAlgorithm
  },
  typeaheadProps: function () {
    return {
      limit: 15,
      query: function (templ, entry) {
        return {
          name: {
            $nin: templ.exchangesNames.get(),
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
          Meteor.call("appendExchange", data._id, templ.currency._id, (error, result) => {
            if (!error) {
              sAlert.success(TAPi18n.__('currency.info.exchange_success_append') + templ.currency.currencyName)
            } else {
              sAlert.error(TAPi18n.__('currency.info.exchange_already_appended') + templ.currency.currencyName)
            }
          })
        }
      },
      create: function (event, input, templ) {
        Meteor.call("addExchange", input, (error, result) => {
          if (!error && result) {
            Meteor.call("appendExchange", result._id, templ.currency._id, (err, res) => {
              if (!err) {
                sAlert.success(TAPi18n.__('currency.info.exchange_new') + templ.currency.currencyName)
              } else {
                sAlert.error(TAPi18n.__('currency.info.exchange_already_appended') + templ.currency.currencyName)
              }
            })
          } else {
            sAlert.error(TAPi18n.__('currency.info.exchange_exists'))
          }
        })
      },
      col: Exchanges, //collection to use
      template: Template.instance(), //parent template instance
      focus: false,
      autoFocus: true,
      quickEnter: true,
      displayField: "name", //field that appears in typeahead select menu
      placeholder: "Add Exchange",
      addButtonText: "Create Exchange",
      customAddButtonExists: true,
      noneFound: TAPi18n.__('currency.info.typeahead'),
      inlineButton: true,
    }
  },
});

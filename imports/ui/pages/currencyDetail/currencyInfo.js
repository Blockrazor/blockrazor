import { Template } from 'meteor/templating'
import { HashAlgorithm, FormData, Currencies } from '/imports/api/indexDB.js'

import './currencyInfo.html'

Template.currencyInfo.onRendered(function() {
  $('[data-toggle="tooltip"]').tooltip()

  $.fn.editable.defaults.mode = 'inline' // display them inline
  $.fn.editableform.buttons = `<button type="submit" class="btn btn-primary btn-sm editable-submit"><i class="fa fa-check"></i></button><button type="button" class="btn btn-default btn-sm editable-cancel"><i class="fa fa-close"></i></button>` // custom buttons with fa icons

  // editable fields
  let editables = ['currencyName', 'currencySymbol', 'gitRepo']

  const validate = function(val) { // the actual proposing part
    if ($(this).attr('id') === 'genesisTimestamp') {
      val = new Date(val).getTime()
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

    return 'Please change the value if you want to propose a change.'
  }

  editables.forEach(i => $(`#${i}`).editable({
    validate: validate
  }))

  $('#premine').editable({type: 'number'});
  $('#maxCoins').editable({type: 'number'});

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
    type: ($('#consensusSecurity').text() === 'Proof of Work' || $('#consensusSecurity').text() === 'Hybrid') ? 'select' : 'text', // only show select for these two
    source: () => {
      if ($('#consensusSecurity').text() === 'Proof of Work') {
        return HashAlgorithm.find({}).fetch().map(i => ({
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
  'click #proposeChange': function(event){
//close modal
$('#coinChangeModal').modal('hide');

//call method to edit coin

      Meteor.call('editCoin', [{
        coin_id: $('#_id').val(),
        coinName: $('#name').val(),
        field: $('#modal_field').val(),
        old: $('#modal_old').val(),
        new: $('#modal_new').val(),
        changedDate: new Date().getTime(),
        score: 0,
        status: 'pending review',
        notes: $('#currencyNotes').val()
      }], (error, result) => {
          if (error) {
            console.log(error.reason)
            sAlert.error(error.reason)
          } else {
            console.log('yay')
            sAlert.success('Change proposed.')
          }
      })
  },
  'click .contribute': function(event) {
      event.preventDefault();
      let slug = FlowRouter.getParam("slug");
      FlowRouter.go('/currencyEdit/' + slug + '/' + event.currentTarget.id);
  }
});

Template.currencyInfo.helpers({
  truncate (val) {
     if (val.length > 20){
    return val.substring(0,20)+'...';
 }
 else{
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
  isNull(val, field) {

      if (val || val === 0) {
          if (typeof val == "string") {
              return val;
          } else if (typeof val == "object") {

              return val[0].join(", ");
          } else if (typeof val == "number") {
              return val;
          }
      } else {
          if (field) {
              return Spacebars.SafeString('<span id=' + field + ' class="label label-danger contribute pointer"><i class="fa fa-plus"></i> Contribute</span>');
          }
      }

  },
      isNullReadOnly(val,field) {

      if (val || val === 0) {
          if (typeof val == "string") {
              return val;
          } else if (typeof val == "object") {

              return val[0].join(", ");
          } else if (typeof val == "number") {
              return val;
          }
      } else {

        return '-'
      }

  },
  hashAlgorithm: function() {
    let prefix = ''
    if (this.consensusSecurity === 'Hybrid') {
      prefix = 'Staking and '
    }

    let algo = HashAlgorithm.findOne({
      _id: this.hashAlgorithm
    })

    return algo ? `${prefix}${algo.name}` : this.hashAlgorithm
  }
});
import { Template } from 'meteor/templating'
import { Currencies } from '../../../api/indexDB.js'
import { HashAlgorithm, FormData } from '../../../api/indexDB.js'

import './currencyDetail.html'
import './features.html'
import './redflags.html'
import './fundamentalMetrics'
import './redFlagCurrency'

Template.currencyDetail.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    // Gets the _id of the current currency and only subscribes to that particular currency
    SubsCache.subscribe('approvedcurrency', FlowRouter.getParam('slug'))
    SubsCache.subscribe('hashalgorithm')
    SubsCache.subscribe('formdata')
  })
});


Template.currencyDetail.events({});

Template.currencyDetail.helpers({
  thiscurrency () {
    return Currencies.findOne({slug: FlowRouter.getParam("slug")});
  },
  currencyName () {
    return Currencies.findOne({slug: FlowRouter.getParam("slug")}).currencyName;
  },


    finalValue () {
      if (this.maxCoins && this.marketCap) {
      return Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
      return "calculating..."
    }
    },
    marketCap () {
      return Math.round(this.marketCap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    circulating () {
      return Math.round(this.circulating).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    launchDate () {
      if (this.genesisTimestamp) {
      return "Launched " + moment(this.genesisTimestamp).fromNow();
    } else {
      return "";
    }
    },
    link () {
      if (this.genesisTimestamp) {
      return "#";
    } else {
      return "/currency/" + this._id + "?edit=launchdate";
    }
    },
    linktext () {
      if (this.genesisTimestamp) {
        return "";
      } else {
        return "Add the " + this.currencyName + " launch date!"
      }
    }

});

Template.currencyInfo.onRendered(function() {
    $('[data-toggle="tooltip"]').tooltip()

    $.fn.editable.defaults.mode = 'inline' // display them inline
    $.fn.editableform.buttons = `<button type="submit" class="btn btn-primary btn-sm editable-submit"><i class="fa fa-check"></i></button><button type="button" class="btn btn-default btn-sm editable-cancel"><i class="fa fa-close"></i></button>` // custom buttons with fa icons

    // editable fields
    let editables = ['currencyName', 'currencySymbol', 'premine', 'maxCoins']

    const validate = function(val) { // the actual proposing part
      if ($(this).attr('id') === 'genesisTimestamp') {
        val = new Date(val).getTime()
      }

      if ($(this).text() !== val) {
        Meteor.call('editCoin', [{
          coin_id: $('#_id').val(),
          coinName: $('#name').val(),
          field: $(this).attr('id'),
          old: $(this).text(),
          new: val,
          changedDate: new Date().getTime(),
          score: 0,
          status: 'pending review'
        }], (error, result) => {
            if (error) {
              console.log(error.reason)
              sAlert.error(error.reason)
            } else {
              console.log('yay')
              sAlert.success('Change proposed.')
            }
        })

        return ''
      }

      return 'Please change the value if you want to propose a change.'
    }

    editables.forEach(i => $(`#${i}`).editable({
      validate: validate
    }))

    $('#genesisTimestamp').editable({
      validate: validate,
      type: 'text',
      value: '01/01/2009'
      /*type: 'combodate', // combodate is refusing to cooperate
      format: 'DD/MM/YYYY',  
      value: '01/01/2009',
      template: 'DD / MM / YYYY',    
      combodate: {
        minYear: 2009,
        maxYear: new Date().getUTCFullYear(),
        smartDays: true
      }*/
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
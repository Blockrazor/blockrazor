
import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js'
import { HashAlgorithm } from '../../lib/database/HashAlgorithm'

Template.currencyDetail.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    // Gets the _id of the current currency and only subscribes to that particular currency
    SubsCache.subscribe('approvedcurrency', FlowRouter.getParam('slug'))
    SubsCache.subscribe('hashalgorithm')
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
    $('[data-toggle="tooltip"]').tooltip();
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
                return Spacebars.SafeString('<span id=' + field + ' class="label label-danger contribute pointer"><i class="fa fa-plus"></i> Contribute</span>');
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





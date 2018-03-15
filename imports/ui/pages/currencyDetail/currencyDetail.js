import { Template } from 'meteor/templating'
import { HashAlgorithm, FormData, Currencies } from '/imports/api/indexDB.js'

import './currencyDetail.html'
import './features.js'
import './feature.js'
import './fundamentalMetrics'
import './redflags.js'
import './currencyInfo'
import './discussion.js'
import './fundamentalMetrics.js'
import './walletimages.js'
import './currency.scss'

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

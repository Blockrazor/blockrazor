import { Template } from 'meteor/templating'
import { HashAlgorithm, FormData, Currencies, Bounties } from '/imports/api/indexDB.js'
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import Cookies from 'js-cookie'

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
import './currencyDetail.scss'
import './summary'
import './summaries'

Template.currencyDetail.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    // Gets the _id of the current currency and only subscribes to that particular currency
    SubsCache.subscribe('approvedcurrency', FlowRouter.getParam('slug'))
    SubsCache.subscribe('hashalgorithm')
    SubsCache.subscribe('formdata')
    SubsCache.subscribe('bounties')
  })

  this.now = new ReactiveVar(Date.now())
    Meteor.setInterval(() => {
        this.now.set(Date.now())
    }, 1000)
});


Template.currencyDetail.events({
  'click #js-cancel': (event, templateInstance) => {
    event.preventDefault()

    Meteor.call('deleteNewBountyClient', `currency-${FlowRouter.getParam('slug')}`, (err, data) => {})
    Cookies.set('workingBounty', false, { expires: 1 })
  },
  'click #js-submitPR': (event, templateInstance) => {
    event.preventDefault()

    if ($('#js-pr').val()) {
      Meteor.call('completeHashPowerBounty', FlowRouter.getParam('slug'), $('#js-pr').val(), (err, data) => {
        if (!data) {
          sAlert.error(TAPi18n.__('currency.detail.invalid_pr'))
        } else {
          sAlert.success(TAPi18n.__('currency.detail.success'))
          Cookies.set('workingBounty', false, { expires: 1 })
        }
      })
    } else {
      sAlert.error(TAPi18n.__('currency.detail.enter_pr'))
    }
  },
  'click #js-extend': (event, templateInstance) => {
    event.preventDefault()

    Meteor.call('extendBounty', FlowRouter.getParam('slug'), (err, data) => {})
  }
});

Template.currencyDetail.helpers({
  activeBounty: () => {
    let bounty = Bounties.find({
      userId: Meteor.userId(),
      type: `currency-${FlowRouter.getParam('slug')}`,
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
      type: `currency-${FlowRouter.getParam('slug')}`,
      completed: false
    }, {
      sort: {
        expiresAt: -1
      }
    }).fetch()[0]

    return TAPi18n.__('currency.detail.time_remaining', {
      postProcess: 'sprintf',
      sprintf: [Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60), Number(bounty.currentReward).toFixed(2)]
    })
  },
  canExtend: () => {
    let bounty = Bounties.find({
      userId: Meteor.userId(),
      type: `currency-${FlowRouter.getParam('slug')}`,
      completed: false
    }, {
      sort: {
        expiresAt: -1
      }
    }).fetch()[0]

    return Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60) < 10 // les than 10 minutes remaining
  },
  thiscurrency () {
    return Currencies.findOne({
      slug: FlowRouter.getParam('slug')
    })
  },
  currencyName () {
    return Currencies.findOne({slug: FlowRouter.getParam("slug")}).currencyName;
  },
  getCurrencySymbol (currency) {
	  if (currency && currency.currencySymbol !== undefined) { return currency.currencySymbol }
	  return "";
  },


    finalValue () {
      if (this.maxCoins && this.marketCap) {
      return Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
      return TAPi18n.__('currency.detail.calculating')
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
      return TAPi18n.__('currency.detail.launched') + moment(this.genesisTimestamp).fromNow();
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
        return TAPi18n.__('currency.detail.add') + this.currencyName + TAPi18n.__('currency.detail.launch_date')
      }
    }

});

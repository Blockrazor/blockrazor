import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties, WalletImages } from '/imports/api/indexDB.js';

import './ratings.html'
import './currencyChoices'
import './currencyChoice'
import './displayRatings'
import './question'
import './upload'

import Cookies from 'js-cookie'
import('sweetalert2').then(swal => window.swal = swal.default)

Template.ratings.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('approvedcurrencies');
    SubsCache.subscribe('ratings');
    SubsCache.subscribe('walletBounty');
    SubsCache.subscribe('walletimages');
  })

  this.now = new ReactiveVar(Date.now())
    Meteor.setInterval(() => {
        this.now.set(Date.now())
    }, 1000)
});


Template.ratings.onRendered(function(){
  this.autorun(function(){
    if (Template.instance().subscriptionsReady()){
      var count = Ratings.find({
        $or: [{
          answered: false,
          catagory: 'wallet'
        }, {
          answered: false,
          context: 'wallet'
        }]
      }).count();

      if (!count) {
        $("#outstandingRatings").hide();
        $("#currencyChoices").show();
      }else{
        $("#outstandingRatings").show();
        $("#currencyChoices").hide();
      }
    }
  })
});

Template.ratings.events({
  'click #elo': function() {
      Meteor.call('tabulateElo');
  },
  'click #wallets': function() {
      Meteor.call('averageElo', 'wallet');
  },
  'click #js-cancel': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('deleteNewBountyClient', 'new-wallet', (err, data) => {})
        Cookies.set('workingBounty', false, { expires: 1 })

        FlowRouter.go('/')
    },
})

Template.ratings.helpers({
  activeBounty: () => {
        let bounty = Bounties.find({
            userId: Meteor.userId(),
            type: 'new-wallet',
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
            type: 'new-wallet',
            completed: false
        }, {
            sort: {
                expiresAt: -1
            }
        }).fetch()[0]
      
        return TAPi18n.__('codebase.time_left', {
            postProcess: 'sprintf',
            sprintf: [Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60), Number(bounty.currentReward).toFixed(2)]
        })
    },
  populateUI() {
  },
  outstandingRatings() {
    var count = Ratings.find({
      $or: [{
        answered: false,
        catagory: 'wallet'
      }, {
        answered: false,
        context: 'wallet'
      }]
    }).count();
    if (!count) {
      $("#outstandingRatings").hide();
      $("#currencyChoices").show();
    };
    return count;
  }
});


// Template.upload.onRendered(function () {
// $('a[data-toggle="tooltip"]').tooltip({
//     placement: 'right',
//     html: true
// });
// });

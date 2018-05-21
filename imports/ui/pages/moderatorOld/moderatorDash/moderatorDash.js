import { Template } from 'meteor/templating';
import { PendingCurrencies } from '/imports/api/indexDB.js';
import { WalletImages, Communities } from '/imports/api/indexDB.js';
import { Bounties } from '/imports/api/indexDB.js';
import './moderatorDash.html'

import '/imports/ui/components/notLoggedIn.html'
import './approveWalletImage.js'
import './approveCommunityImage.js'
import './moderatorPendingCurrency.js'

Template.moderatorDash.onCreated(function bodyOnCreated() {
  var self = this;
  self.autorun(function(){
    SubsCache.subscribe('pendingcurrencies');
    SubsCache.subscribe('walletimages');
     SubsCache.subscribe('communities');
  })

  this.reject = new ReactiveVar(false)
  this.currentlyRejecting = new ReactiveVar(null)
  this.submittername = new ReactiveVar(null)
  this.owner = new ReactiveVar(null)
  this.currencyName = new ReactiveVar(null)
})

Template.moderatorDash.events({
  'submit form': function (data, templateInstance) {
    data.preventDefault();
    Meteor.call('rejectCurrency', templateInstance.currencyName.get(), templateInstance.currentlyRejecting.get(), templateInstance.owner.get(), data.target.reason.value, Meteor.userId());
    templateInstance.reject.set(false)
    templateInstance.currentlyRejecting.set(null)
    templateInstance.submittername.set(null)
    templateInstance.owner.set(null)
    templateInstance.currencyName.set(null)
  },
  'click #elo': (event, templateInstance) => {
    Meteor.call('tabulateElo', (err, data) => {})
  },
  'click .avg-elo': (event, templateInstance) => {
    Meteor.call('averageElo', $(event.currentTarget).attr('id'), (err, data) => {})
  },
});

Template.moderatorDash.helpers({
  pendingCommunityImages() {
    return Communities.find({approved: false});
  },
  pendingWalletImages() {
    return WalletImages.find({approved: false});
  },
  pendingCurrencies() {
        return PendingCurrencies.find({}, { sort: { createdAt: -1 }, limit: 20});
      }
});
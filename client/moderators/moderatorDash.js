import { Template } from 'meteor/templating';
import { PendingCurrencies } from '../../lib/database/Currencies.js';
import { WalletImages } from '../../lib/database/Images.js';
import { Bounties } from '../../lib/database/Bounties.js';

Template.moderatorDash.onCreated(function bodyOnCreated() {
  var self = this;
  self.autorun(function(){
    SubsCache.subscribe('pendingcurrencies');
    SubsCache.subscribe('bounties');
    SubsCache.subscribe('walletimages');
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
  pendingWalletImages() {
    return WalletImages.find({approved: false});
  },
  pendingAPIBounties() {
    return Bounties.find({pendingApproval: true, bountyType: "HashrateAPI"});
  },
  pendingCurrencies() {
        return PendingCurrencies.find({}, { sort: { createdAt: -1 }, limit: 20});
      }
});

Template.approveWalletImage.events({
  'click #reject': function(event){
    Meteor.call('flagWalletImage', this._id);
    console.log(this._id);
  },
  'click #approve': function(event){
    Meteor.call('approveWalletImage', this._id);
  }
});

Template.approveWalletImage.helpers({
  display() {
    if(_.include(this.flaglikers, Meteor.userId())) {
      return "none";
    } else {return "flex"}
  }
})

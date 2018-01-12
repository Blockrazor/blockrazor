import { Template } from 'meteor/templating';
import { PendingCurrencies } from '../../lib/database/Currencies.js';
import { WalletImages } from '../../lib/database/Images.js';
import { Bounties } from '../../lib/database/Bounties.js';

Template.moderatorDash.onCreated(function bodyOnCreated() {
  var self = this;
  self.autorun(function(){
    self.subscribe('pendingcurrencies');
    self.subscribe('bounties');
    self.subscribe('walletimages');
  })
});

Template.moderatorDash.onRendered( function () {
Session.set('reject', false);
});

Template.moderatorDash.events({
  'submit form': function (data) {
    data.preventDefault();
    Meteor.call('rejectCurrency', Session.get('currencyName'), Session.get('currentlyRejecting'), Session.get('owner'), data.target.reason.value, Meteor.userId());
    Session.set('reject', false);
    Session.set('currentlyRejecting', null);
    Session.set('submittername', null);
    Session.set('owner', null);
    Session.set('currencyName', null);
  }
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

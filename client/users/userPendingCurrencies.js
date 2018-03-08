import { Template } from 'meteor/templating';
import { PendingCurrencies, RejectedCurrencies } from '../../lib/database/Currencies.js';
import { Bounties } from '../../lib/database/Bounties.js';

Template.userPendingCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function() {
    SubsCache.subscribe('bounties');
    SubsCache.subscribe('pendingcurrencies');
    SubsCache.subscribe('rejectedcurrencies');
  })
});

Template.userPendingCurrencies.onRendered( function () {

});

Template.userPendingCurrencies.helpers({
  pendingbounties() {
    return Bounties.find({pendingApproval: true, completedBy: Meteor.user()._id});
  },
  rejectedbounties() {
    return Bounties.find({pendingApproval: false, approved: false, completedBy: Meteor.user()._id});
  },
  pendingcurrencies() {
    // if(_.size(PendingCurrencies.find({owner: Meteor.user()._id}).fetch()) == 0) {
    //   Session.set('pending', "You have no new currencies waiting approval");
    // } else {
    //   Session.set('pending', "");
      return PendingCurrencies.find({owner: Meteor.user()._id});
    //}
  },
  rejectedcurrencies() {
    // if(_.size(RejectedCurrencies.find({owner: Meteor.user()._id}).fetch()) == 0) {
    //   Session.set('rejectedcoins', "You have no rejected currencies");
    // } else {
    //   Session.set('rejectedcoins', "");
      return RejectedCurrencies.find({owner: Meteor.user()._id});
    //}
  },
});

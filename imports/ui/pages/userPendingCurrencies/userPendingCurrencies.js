import { Template } from 'meteor/templating';
import { PendingCurrencies, RejectedCurrencies, Bounties } from '/imports/api/indexDB.js';

import './userPendingCurrencies.html'
import '/imports/ui/components/notLoggedIn.html'
import './userPendingCurrency'
import './userPendingBounty'

Template.userPendingCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function() {
    SubsCache.subscribe('bounties');
    SubsCache.subscribe('mypendingcurrencies');
    SubsCache.subscribe('myrejectedcurrencies');
  })
});

Template.userPendingCurrencies.onRendered( function () {

});

Template.userPendingCurrencies.helpers({
  pendingbounties() {
    return Bounties.find({
      type: new RegExp('currency-'), // currently, only these can be pending
      pendingApproval: true,
      userId: Meteor.userId()
    }, {
      sort: {
        completedAt: -1
      }
    })
  },
  rejectedbounties() {
    return Bounties.find({
      type: new RegExp('currency-'),
      pendingApproval: false,
      approved: false,
      userId: Meteor.userId()
    }, {
      sort: {
        completedAt: -1
      }
    })
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

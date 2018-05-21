import { Template } from 'meteor/templating';
import { PendingCurrencies } from '/imports/api/indexDB.js';
import { WalletImages, Communities } from '/imports/api/indexDB.js';
import { Bounties } from '/imports/api/indexDB.js';
import './moderatorDash.html'

import '/imports/ui/components/notLoggedIn.html'
import './approveWalletImage.js'
import './approveCommunityImage.js'
import './moderatorPendingCurrency.js'


function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min; // min - inclusive, max - exclusive
}

function getApprovalItemsToDisplay(type) {
  switch (type) {
    case "moderatorPendingCurrency" :
          return PendingCurrencies.find({}, { sort: { createdAt: -1 }})
          break
    case "approveWalletImage" :
          return WalletImages.find({approved: false})
          break
    case "approveCommunityImage" :
          return Communities.find({approved: false})
          break
  }
}

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
  this.approvalDisplayOrder = ["moderatorPendingCurrency", "approveWalletImage", "approveCommunityImage"]
  this.nothingToApprove = new ReactiveVar(true)
  this.displayingApproval = new ReactiveVar(null)
  this.displayingApprovalData = new ReactiveVar(null)

  this.autorun(()=>{
    let lastApproval = Session.get('lastApproval')
    let nextIndex = 0
    this.nothingToApprove.set(true)

    if (lastApproval) {
      let lastIndex = this.approvalDisplayOrder.indexOf(lastApproval)
      // set currentApproval to next approval type in the array
      nextIndex = lastIndex + 1 < this.approvalDisplayOrder.length ? ++lastIndex : 0
    }

    // check whether an Item from nextApproval type availble
    // if not availble, iterate through types to check Item from next type available
    let iterator = this.approvalDisplayOrder.length
    while (iterator > 0) {
      //check whether data available
      let nextApprovalType = this.approvalDisplayOrder[nextIndex]
      let approvalListFromNextType = getApprovalItemsToDisplay(nextApprovalType);

      if (approvalListFromNextType) {
        let fetchedApprovalList = approvalListFromNextType.fetch()

        if (fetchedApprovalList.length > 0) {
          let randomApprovalItemFromList = fetchedApprovalList[getRandomInt(0, fetchedApprovalList.length)]

          //if data availble, set reactiveVar and break iteration
          this.displayingApproval.set(nextApprovalType)
          this.displayingApprovalData.set(randomApprovalItemFromList)
          this.nothingToApprove.set(false)
          break;
        }
      }
      nextIndex = nextIndex + 1 < this.approvalDisplayOrder.length ? ++nextIndex : 0
      iterator--
    }

  })
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
  approvalItem() {
    return Template.instance().displayingApproval.get();
  },
  approvalItemData() {
    return Template.instance().displayingApprovalData.get();
  }
});
import { Template } from 'meteor/templating';
import { Bounties, BountyTypes } from '/imports/api/indexDB.js';
import { FlowRouter } from 'meteor/staringatlights:flow-router';;
import Cookies from 'js-cookie';

import './bountyRender.html'
import { LocalBounties } from './bounties'
import '/imports/ui/components/global/globalHelpers'

Template.bountyRender.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('bountytypes');
  });
})


const custom = ['new-currency', 'new-hashpower', 'new-codebase', 'new-community', 'new-wallet']

const canContinue = (id) => {
  if (id && (~custom.indexOf(id) || id.startsWith('currency-'))) {
    let b = Bounties.findOne({
      userId: Meteor.userId(),
      type: id,
      completed: false
    })

    return b && b.expiresAt > Date.now()
  } else {
    return false // if it's a normal bounty, it doesn't have this
  }
}

Template.bountyRender.helpers({
  bountyReset: function() {
	  return this.previousReward && this.previousCompletedAt > (new Date().getTime() - 7200000) // show the sign for 2 hours
  },
  bountyResetText: function() {
    return `${this.currentUsername} has claimed this bounty for ${this.previousReward} KZR and the bounty reward has been reset.`
  },
  types: function () {
    return this.types || BountyTypes.findOne();
  },
  id: function() {
    return this._id;
  },
  isProblem: function() {
    return !!this.isProblem
  },
  workingText: function () {
    if (this.workingText) {
      return this.workingText
    }

    if(this.currentlyAvailable == false) {
        return this.currentUsername + " is working on this right now!";
    } else { return null;}
  },
  canContinue: function() {
    return canContinue(this._id)
  },
  buttonClass: function() {
    let b = Bounties.findOne({
      userId: Meteor.userId(),
      completed: false
    })

    /*if (this._id.startsWith('currency-')) {
      this.currentlyAvailable = !b || b.type !== this._id || canContinue(this._id)

      if (!this.currentlyAvailable) {
        this.workingText = 'Someone is working on it.'
      }
    }*/

    // grey out the button if the bounty is not currently available, or if the use is already working on another bounty
    // of course, don't grey it out if the user can continue tha current bounty
    // special case
    if (this._id && this._id.startsWith('currency-')) {
      if (canContinue(this._id) || (this.currentlyAvailable && !(b && b.expiresAt > Date.now()))) {
        return "btn-outline-primary takeBounty"
      } else {
        return "btn-outline-secondary"
      }
    }

    if(this.currentlyAvailable === false || (b && b.expiresAt > Date.now()) && !canContinue(this._id)) {
        return "btn-outline-secondary";
    } else {
      return "btn-outline-primary takeBounty"
    }
  },
  reward: function () {
    var b = LocalBounties.findOne(this._id, {fields: {reward: 1}}).reward
    return (b || 0).toFixed(6)
  }
});

Template.bountyRender.events({
  'click .gotoProblem': function(event, templateInstance) {
    event.preventDefault()

    FlowRouter.go(this.url)
  },
  'click .start': function (event, templateInstance) {
    if (canContinue(this._id)) {
      FlowRouter.go(this.url)
    } else {
        Session.set("workingBounty", true)
        Cookies.set('workingBounty', true, { expires: 1 });
        Cookies.set('expiresAt', Date.now() + 3600000, { expires: 1 }); //
        //Session.set('bountyItem', this._id);
        Cookies.set('bountyItem', this._id, { expires: 1});
        Cookies.set('bountyType', this.bountyType, { expires: 1});
        Session.set('bountyType', this.bountyType);
        if (this._id && (~custom.indexOf(this._id) || this._id.startsWith('currency-'))) {
          Meteor.call('addNewBounty', this._id, calculateReward.call(this, Date.now()), this.time, (err, data) => {})
          FlowRouter.go(this.url)
        } else {
          Meteor.call('startBounty', this._id)
          FlowRouter.go("/bounties/" + this._id)
        }
    }
  },
  'click .cancel': function() {
    if (this._id && (~custom.indexOf(this._id) || this._id.startsWith('currency-'))) {
      Meteor.call('deleteNewBountyClient', this._id, (err, data) => {})
      Cookies.set('workingBounty', false, { expires: 1 })
    }
    $('#' + this._id).hide();
    $('#takeBounty' + this._id).show();
  },
  'click .takeBounty': function() {
    $('#' + this._id).show();
    $('#takeBounty' + this._id).hide();
  }
})

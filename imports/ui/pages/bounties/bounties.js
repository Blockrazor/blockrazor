import { Template } from 'meteor/templating';
import { Bounties, REWARDCOEFFICIENT } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie';

export function calculateReward (now) { //used in bountyRender too
  return (((now - this.creationTime) / REWARDCOEFFICIENT) * (this.multiplier || 1)).toFixed(6)
}

import './bounties.html'
import './rainbow.js';
import './miscellaneous.js'
import './HashrateAPI.js'
import './bountyRender.js'
import './activeBounty.js'


Template.bounties.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('bounties');
  })

  this.bountyType = new ReactiveVar('')
  this.now = new ReactiveVar(null)
  this.workingBounty = new ReactiveVar('')

  this.times = new ReactiveVar({})

  Meteor.call('getLastCurrency', (err, data) => {
    let times = this.times.get()
    times['new-currency'] = data.approvedTime
    this.times.set(times)
  })

  Meteor.call('getLastHashPower', (err, data) => {
    let times = this.times.get()
    times['new-hashpower'] = data.createdAt || Date.now()
    this.times.set(times)
  })

  Meteor.call('getLastCommunityAnswer', (err, data) => {
    let times = this.times.get()
    times['new-community'] = data.answeredAt || Date.now()
    this.times.set(times)
  })

  Meteor.call('getLastWalletAnswer', (err, data) => {
    let times = this.times.get()
    times['new-wallet'] = data.answeredAt || Date.now()
    this.times.set(times)
  })

  Meteor.call('getLastCodebaseAnswer', (err, data) => {
    let times = this.times.get()
    times['new-codebase'] = data.answeredAt || Date.now()
    this.times.set(times)
  })
})

Template.bounties.onRendered(function(){
  this.workingBounty.set(false)
  Meteor.setInterval(() => {
      this.now.set(Date.now());
  }, 10);
});


Template.bounties.helpers({
  bounties: function() {
    return Bounties.find({
      pendingApproval: false
    }).fetch().map(i => {
      i.creationTime = i.creationTime || Template.instance().times.get()[i._id]

      return i
    }).sort((i1, i2) => {
      return calculateReward.call(i2, Template.instance().now.get(), Template.instance()) - calculateReward.call(i1, Template.instance().now.get())
    })
  }
});


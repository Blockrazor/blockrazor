import { Template } from 'meteor/templating';
import { Bounties, REWARDCOEFFICIENT, Problems } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie';

export function calculateReward (now) { //used in bountyRender too
  return (this.credit ? this.credit.reduce((i1, i2) => i1 + i2.bounty, 0) : (((now - this.creationTime) / REWARDCOEFFICIENT) * (this.multiplier || 1))).toFixed(6)
}

import './bounties.html'
import './rainbow.js';
import './miscellaneous.js'
import './HashrateAPI.js'
import './bountyRender.js'
import './activeBounty.js'


Template.bounties.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('bounties')
    SubsCache.subscribe('problems')
  })

  Session.set('bountyType', "")
  Session.set("now", Date.now())
  Session.set("workingBounty", false)

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
  Session.set('workingBounty', false) 
  Meteor.setInterval(() => {
      Session.set('now', Date.now())
  }, 10);
});


Template.bounties.helpers({
  bounties: function() {
    let problems = Problems.find({ // dont show questions in here
      $or: [{
        type: 'feature'
      }, {
        type: 'bug'
      }],
      open: true,
      solved: false
    }).fetch().map(i => ({
      problem: i.header, 
      solution: 'Check the problem page.',
      types: {
        heading: i.header
      },
      credit: i.credit,
      currentlyAvailable: !i.locked, 
      currencyName: 'Blockrazor', 
      pendingApproval : false, 
      url : `/problem/${i._id}`,
      isProblem: true,
      workingText: i.locked ? 'Someone is working on it.' : ''
    }))

    return _.union(Bounties.find({ // inject problems here
      pendingApproval: false
    }).fetch().map(i => {
      i.creationTime = i.creationTime || Template.instance().times.get()[i._id]

      return i
    }), problems).sort((i1, i2) => {
      return calculateReward.call(i2, Session.get('now'), Template.instance()) - calculateReward.call(i1, Session.get('now'))
    })
  }
});


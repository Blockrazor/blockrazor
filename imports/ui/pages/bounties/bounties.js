import { Template } from 'meteor/templating';
import { Bounties, REWARDCOEFFICIENT, Problems, Currencies } from '/imports/api/indexDB.js';
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
    SubsCache.subscribe('approvedcurrencies')
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

  //may return a document field without createdAt field
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

    let currencies = Currencies.find({
      hashpowerApi: {
        $ne: true
      }
    }).fetch().map(i => ({
      _id: `currency-${i.slug}`,
      problem: 'Hash power API call is not available or it\'s broken', 
      solution: 'Add a hash power API call to help us determine the hash power',
      types: {
        heading: 'Add a hash power API call',
        rules : 'If you accept this bounty, you\'ll have 2 hours to complete it and send a pull request with hash power API call for the given reward. 10 minutes before expiration, you\'ll get a chance to extend the time limit.'
      },
      currencyName: i.currencyName, 
      pendingApproval : false, 
      url: `/currency/${i.slug}`,
      creationTime: i.createdAt,
      time: 7200000.0,
      multiplier: 0.9
    }))

    return _.union(Bounties.find({ // inject problems here
      pendingApproval: false
    }).fetch().map(i => {
      i.creationTime = i.creationTime || Template.instance().times.get()[i._id]

      return i
    }), problems, currencies).sort((i1, i2) => {
      return calculateReward.call(i2, Session.get('now'), Template.instance()) - calculateReward.call(i1, Session.get('now'))
    })
  }
});


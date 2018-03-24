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
    SubsCache.subscribe('users')
  })
  
  Session.set('bountyType', "")
  Session.set("now", Date.now())
  Session.set("workingBounty", false)

  this.times = new ReactiveVar({})
  this.bounties = new ReactiveVar(null)

  this.LocalBounties = new Mongo.Collection(null);
  this.currentIds = new ReactiveVar(null)

  this.filter = new ReactiveVar({})

  Meteor.call('getLastCurrency', (err, data) => {
    let times = this.times.get()
    times['new-currency'] = data.createdAt
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

  this.autorun((comp)=>{
    let problems = Problems.find({ // dont show questions in here
      $or: [{
        type: 'feature'
      }, {
        type: 'bug'
      }],
      open: true,
      solved: false
    }).fetch().map(i => ({
      _id: i._id,
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
    }).fetch().map(i => {
      let b = Bounties.findOne({
        type: `currency-${i.slug}`
      })
      return {
        _id: `currency-${i.slug}`,
        problem: 'Hash power API call is not available or it\'s broken', 
        solution: 'Add a hash power API call to help us determine the hash power',
        types: {
          heading: 'Add a hash power API call',
          rules : 'If you accept this bounty, you\'ll have 2 hours to complete it and send a pull request with hash power API call for the given reward. 10 minutes before expiration, you\'ll get a chance to extend the time limit.'
        },
        currencyName: i.currencyName,
        pendingApproval : false, 
        currentlyAvailable: !(b && b.expiresAt > Date.now()),
        currentUsername: b && (Meteor.users.findOne({
          _id: b.userId
        }) || {}).username,
        url: `/currency/${i.slug}`,
        creationTime: i.createdAt,
        time: 7200000.0,
        multiplier: 0.9
      }
    })

    var union = _.union(Bounties.find({ // inject problems here
      pendingApproval: false
    }).fetch().map(i => {
      i.creationTime = i.creationTime || Template.instance().times.get()[i._id]

      return i
    }), problems, currencies).sort((i1, i2) => {
      return calculateReward.call(i2, Session.get('now'), Template.instance()) - calculateReward.call(i1, Session.get('now'))
    })

    //this map copies over values to local collection so that updates can be diffed in order to notify user that bounty reward has been reset
    //  and adds last reward from when bounty was completed previously
    union.map((x, i)=>{
      // return this.LocalBounties.insert(x)
      //note the field projection
      var lastCompletedBounty = Bounties.findOne({type: x._id, completed: true, currentReward: {$exists: true}}, {sort: {completedAt: -1}, fields: {currentReward: 1, completedAt: 1, currentUsername: 1}})
      //preserves previous sort operation
      x.sort = i
      var copy = this.LocalBounties.findOne(x._id)
      if (lastCompletedBounty && copy){
        x.previousReward = lastCompletedBounty.currentReward
        //detects if bounty has been reset
        if (x.previousCompletedAt = lastCompletedBounty.completedAt){
          sAlert.warning('Bounty reset')
          x.previousCompletedAt = lastCompletedBounty.completedAt
        }
        this.LocalBounties.update(x._id, x)
      } else if (copy) {
        this.LocalBounties.update(x._id, x)
      } else {
        if (lastCompletedBounty) {
          x.currentUsername = lastCompletedBounty.currentUsername
          x.previousReward = lastCompletedBounty.currentReward
          x.previousCompletedAt = lastCompletedBounty.completedAt
        }
        this.LocalBounties.insert(x)
      }
    })

      //lets filter out removed/replaced items from union since _id field is transcient for Bounties
      var ids = union.map(x=>x._id)
      this.currentIds.set(ids)

  })
})

Template.bounties.onRendered(function(){
  Session.set('workingBounty', false) 
  Meteor.setInterval(() => {
      Session.set('now', Date.now())
  }, 10);//10
})

Template.bounties.events({
    'change #js-filter': (event, templateInstance) => {
        let ev = $(event.currentTarget).val()
        let filter = {}

        if (ev === 'coding') {
            filter = {
                $or: [{
                    _id: 'new-codebase' // codebase questions
                }, {
                    isProblem: true // problems
                }, {
                    _id: new RegExp('currency-', 'ig') // hash power API PR
                }]
            }
        } else if (ev === 'questions') {
            filter = {
                $or: [{
                    _id: 'new-community' // community questions
                }, {
                    _id: 'new-wallet' // wallet questions
                }]
            }
        } else if (ev === 'data') {
            filter = {
                $or: [{
                    _id: 'new-currency' // add new currency
                }, {
                    _id: 'new-hashpower' // add new hashpower data
                }]
            }
        }

        templateInstance.filter.set(filter)
    }
})


Template.bounties.helpers({
  bounties: function() {
    var templ = Template.instance()
    //returns transformed group of collections
    filter = _.extend(templ.filter.get(), {_id: {$in: templ.currentIds.get()}})
    return templ.LocalBounties.find(filter, {sort: {sort: 1}})
  }
});


import { Template } from 'meteor/templating';
import { Bounties, REWARDCOEFFICIENT, Problems, Currencies, PendingCurrencies, UserData, Ratings, HashPower } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie';
import('sweetalert2').then(swal => window.swal = swal.default)

export const LocalBounties = new Mongo.Collection(null)

import './bounties.html'
import './bounties.scss'
import './rainbow.js';
import './miscellaneous.js'
import './HashrateAPI.js'
import './bountyRender.js'
import './activeBounty.js'

function calculateReward (now) { //used in bountyRender too
  let add = 0
  if (this._id === 'new-currency') {
      add = 1
  }
  var res = (this.credit ? this.credit.reduce((i1, i2) => i1 + i2.bounty, 0) : (((now - this.creationTime) / REWARDCOEFFICIENT) * (this.multiplier || 1) + add))
  return res
}

function setFilterQuery (bountyPref) {
  let filter = []

  if (bountyPref.indexOf('coding') != -1) {
    filter.push({
        _id: 'new-codebase' // codebase questions
    },{
        isProblem: true // problems
    },{
        _id: new RegExp('currency-', 'ig') // hash power API PR
    })
  } 
  if (bountyPref.indexOf('questions') != -1) {
    filter.push({
        _id: 'new-community' // community questions
    },{
        _id: 'new-wallet' // wallet questions
    })
  }
  if (bountyPref.indexOf('data') != -1) {
    filter.push({
        _id: 'new-currency' // add new currency
    },{
        _id: 'new-hashpower' // add new hashpower data
    })
  }

  if (filter.length > 0) {
    Template.instance().filter.set({$or : filter})
  }else {
    Template.instance().filter.set({})
  }
}

Template.bounties.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('visibleBounties')
    SubsCache.subscribe('bountyProblems', 0, 0)
    SubsCache.subscribe('bountyCurrencies', 0, 0)
    SubsCache.subscribe('users')
    SubsCache.subscribe('bountyRating')
    SubsCache.subscribe('bountyLastCurrency')
    SubsCache.subscribe('bountyLastHash')
  })

  Session.set('bountyType', "")
  Session.set("now", Date.now())
  Session.set("workingBounty", false)

  this.times = new ReactiveDict()
  this.bounties = new ReactiveVar(null)

  this.LocalBounties = LocalBounties
  this.currentIds = new ReactiveVar(null)

  this.filter = new ReactiveVar({})

  Tracker.autorun(() => {
    this.times.set('new-currency', (PendingCurrencies.findOne({}, { sort: { createdAt: -1 }}) || {}).createdAt || (Currencies.findOne({}, { sort: { createdAt: -1 }}) || {}).createdAt || Date.now())
  })

  Tracker.autorun(() => {
    this.times.set('new-hashpower', (HashPower.findOne({}, { sort: { createdAt: -1 }}) || {}).createdAt || Date.now())
  })

  Tracker.autorun(() => {
    this.times.set('new-codebase', (Ratings.findOne({
        $or: [{
            catagory: 'codebase'
        }, {
            context: 'codebase'
        }]
    }, {
        sort: {
            answeredAt: -1
        }
    }) || {}).answeredAt || Date.now())
  })

  Tracker.autorun(() => {
    this.times.set('new-community', (Ratings.findOne({
        $or: [{
            catagory: 'community'
        }, {
            context: 'community'
        }]
    }, {
        sort: {
            answeredAt: -1
        }
    }) || {}).answeredAt || Date.now())
  })

  Tracker.autorun(() => {
    this.times.set('new-wallet', (Ratings.findOne({
        $or: [{
            catagory: 'wallet'
        }, {
            context: 'wallet'
        }]
    }, {
        sort: {
            answeredAt: -1
        }
    }) || {}).answeredAt || Date.now())
  })

   //  references to LocalBounty have to be nonreactive since rewards are appended to documents separately causing a loop with reactivity on
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
      solution: TAPi18n.__('bounties.solution'),
      types: {
        heading: i.header
      },
      credit: i.credit,
      currentlyAvailable: !i.locked,
      currencyName: 'Blockrazor',
      pendingApproval : false,
      url : `/problem/${i._id}`,
      isProblem: true,
      workingText: i.locked ? TAPi18n.__('bounties.someone_working') : '',
      reward: i.reward
    }))

    let currencies = Currencies.find({
      hashpowerApi: {
        $ne: true
      },
      consensusSecurity: 'Proof of Work'
    }).fetch().map(i => {
      let b = Bounties.findOne({
        type: `currency-${i.slug}`
      }, {
        sort: {
            expiresAt: -1
        }
      })
      return {
        _id: `currency-${i.slug}`,
        problem: TAPi18n.__('bounties.hash_problem'),
        solution: TAPi18n.__('bounties.hash_solution'),
        types: {
          heading: TAPi18n.__('bounties.hash_heading'),
          rules : TAPi18n.__('bounties.hash_rules')
        },
        currencyName: i.currencyName,
        pendingApproval : false,
        currentlyAvailable: !(b && b.expiresAt > Date.now()),
        currentUsername: (b && b.expiresAt > Date.now()) && (Meteor.users.findOne({
          _id: b.userId
        }).username || ''),
        currentUserId: (b && b.expiresAt > Date.now()) && (Meteor.users.findOne({
          _id: b.userId
        })._id || ''),
        url: `/currency/${i.slug}`,
        creationTime: i.createdAt,
        time: 7200000.0,
        multiplier: 0.9,
        reward: i.reward
      }
    })

    var union = _.union(Bounties.find({ // inject problems here
      pendingApproval: false
    }).fetch().map(i => {
      i.creationTime = i.creationTime || Template.instance().times.get(i._id)
      return i
    }), problems, currencies)

    //this map copies over values to local collection so that updates can be diffed in order to notify user that bounty reward has been reset
    //  and adds last reward from when bounty was completed previously
    //  has to be nonreactive since rewards are appended to documents separately causing a loop with reactivity on
    Tracker.nonreactive(()=>{
    union.map((x, i)=>{
      var copy = this.LocalBounties.findOne(x._id)
      if (copy) {
        this.LocalBounties.update(x._id, x)
      } else {
        this.LocalBounties.insert(x)
      }
    })
  })

      //lets filter out removed/replaced items from union since _id field is transcient for Bounties
      var ids = union.map(x=>x._id)
      this.currentIds.set(ids)
  })

  this.autorun(()=>{
    this.LocalBounties.find({_id: {$in: this.currentIds.get()}}).forEach((x, i)=>{
      this.LocalBounties.update(x._id, {$set: { reward: calculateReward.call(x, Session.get('now'))}})
    })
  })

  window.calculateReward = calculateReward
  window.LocalBounties = this.LocalBounties
})

Template.bounties.onRendered(function(){
  Session.set('workingBounty', false)
  Meteor.setInterval(() => {
      Session.set('now', Date.now())
  }, 10);//10

  // taking preferred bounty types from UserData collection (globally subscribed to publicUserData)
  let bountyPref = (UserData.findOne({
    _id: Meteor.userId()
  }) || {}).bountyPreference

  // if saved preferred types unavailable, set all as preferred
  bountyPref = bountyPref === undefined ? ["coding", "data", "questions"] : bountyPref
  // set the filter query based on user preference
  setFilterQuery (bountyPref)

  // initially set status of bounty filter checkboxes based on user preference
  if (bountyPref.indexOf('coding') != -1) {
    $('#coding-skills-required').prop('checked', true);
  }
  if (bountyPref.indexOf('data') != -1) {
    $('#adding-new-data').prop('checked', true);
  }
  if (bountyPref.indexOf('questions') != -1) {
    $('#answering-questions').prop('checked', true);
  }
})

Template.bounties.events({
  'click #js-shareUrl': (event, templateInstance) => {
      event.preventDefault()
      
      swal({
          title: TAPi18n.__('bounties.share_5'),
          input: 'text',
          confirmButtonText: 'Ok',
          confirmButtonColor : "#000",
          inputValue: "https://blockrazor.org/#H8hpyxk5uoiuiZSbmdfX",
          inputAttributes: {
              id: 'shareURL'
          }

      })
      $('#shareURL').focus()
      $('#shareURL').select()

  },
  'click .form-check-input': function(ev, tpl) {
      var setFilter = tpl.$('input:checked').map(function() {
          return $(this).val();
      });
      let bountyPref = $.makeArray(setFilter)
      Meteor.call("bountyPreference", bountyPref)
      setFilterQuery (bountyPref)
  }
})


Template.bounties.helpers({
	bounties: function() {
    var templ = Template.instance()
    var filterList = templ.filter.get()
    //returns transformed group of collections
    if (!_.isEmpty(filterList)) {
      filter = _.extend(filterList, {
        _id: { $in: templ.currentIds.get() }, currentUserId: { $ne: Meteor.userId() ? Meteor.userId() : "" }
      })
      //avoids rerendering whole list if reward is changed which it does
      return templ.LocalBounties.find(filter, 
        {sort: {reward: -1}, fields: {reward: 0}}
      )
    }else {
      return []
    }
	},
	currentActiveBounties: function () {
		var templ = Template.instance();
		return templ.LocalBounties.find({currentUserId: Meteor.userId()})
	}
});

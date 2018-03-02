import { Template } from 'meteor/templating';
import './rainbow.js';
import { Bounties, BountyTypes, REWARDCOEFFICIENT } from '../../../lib/database/Bounties.js';
import { FlowRouter } from 'meteor/kadira:flow-router';
import Cookies from 'js-cookie';

Template.bounties.onCreated(function(){
  this.autorun(() => {
    this.subscribe('bounties');
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

Template.bountyRender.onCreated(function(){
  this.autorun(() => {
    this.subscribe('bountytypes');
  });
})

const custom = ['new-currency', 'new-hashpower', 'new-codebase', 'new-community', 'new-wallet']

const calculateReward = function(now) {
  return (((now - this.creationTime) / REWARDCOEFFICIENT) * (this.multiplier || 1)).toFixed(6)
}

const canContinue = (id) => {
  if (~custom.indexOf(id)) {
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
  types: function () {
    return this.types || BountyTypes.findOne();
  },
  id: function() {
    return this._id;
  },
  workingText: function () {
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

    // grey out the button if the bounty is not currently available, or if the use is already working on another bounty
    // of course, don't grey it out if the user can continue tha current bounty
    if(this.currentlyAvailable === false || (Cookies.get('workingBounty') === 'true' && b && b.expiresAt > Date.now()) && !canContinue(this._id)) {
        return "btn-outline-secondary";
    } else { 
      return "btn-outline-primary takeBounty"
    }
  },
  reward: function () {
    return calculateReward.call(this, Template.instance().view.parentView.parentView.parentView.templateInstance().now.get())
  }
});

Template.bountyRender.events({
  'click .start': function (event, templateInstance) {
    if (canContinue(this._id)) {
      FlowRouter.go(this.url)
    } else {
      if(Cookies.get('workingBounty') != "true") {
        Template.instance().view.parentView.parentView.parentView.templateInstance().workingBounty.set(true);
        Cookies.set('workingBounty', true, { expires: 1 });
        Cookies.set('expiresAt', Date.now() + 3600000, { expires: 1 }); //
        //Session.set('bountyItem', this._id);
        Cookies.set('bountyItem', this._id, { expires: 1});
        Cookies.set('bountyType', this.bountyType, { expires: 1});
        Template.instance().view.parentView.parentView.parentView.templateInstance().bountyType.set(this.bountyType);
        if (~custom.indexOf(this._id)) {
          Meteor.call('addNewBounty', this._id, calculateReward.call(this, Date.now()), this.time, (err, data) => {})
          FlowRouter.go(this.url)
        } else {
          Meteor.call('startBounty', this._id)
          FlowRouter.go("/bounties/" + this._id)
        }
      } else if (Cookies.get('workingBounty') == "true") {
        sAlert.error("You already have a bounty in progress!");
        if (~custom.indexOf(this._id)) {
          FlowRouter.go(this.url)
        } else {
          FlowRouter.go("/bounties/" + Cookies.get('bountyItem'))          
        }
      }
    }

  },
  'click .cancel': function() {
    if (~custom.indexOf(this._id)) {
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

Template.activeBounty.onCreated(function() {
  this.now = new ReactiveVar(Date.now())
  this.bountyType = new ReactiveVar('')
})

Template.activeBounty.onRendered(function(){
  this.bountyType.set(Cookies.get('bountyType'))
  Meteor.setInterval(() => {
      this.now.set(Date.now())
  }, 1000);
  Meteor.setInterval(function() {
      if(Date.now() >= Cookies.get('expiresAt')) {
        FlowRouter.go("/bounties");
      }
  }, 1000);
});

Template.activeBounty.onCreated(function(){
  this.autorun(() => {
    this.subscribe('bounties', FlowRouter.getParam("_id"));
  });
});//Session.set('activeBountyRendered', true);

Template.activeBounty.helpers({
  timeRemaining () {

    return "Time remaining: " + Math.round((Bounties.findOne({
      _id: Cookies.get('bountyItem')
    }).expiresAt - Template.instance().now.get())/1000/60) + " minutes.";
  }
});
Template.activeBounty.events({
  'click .cancel': function () {
    Cookies.set('workingBounty', false);
    Cookies.set('bountyItem', null);
    Cookies.set('bountyType', null);
    Cookies.set('expiresAt', null);
    Meteor.call('cancelBounty', FlowRouter.getParam("_id"));
    FlowRouter.go("/");
  }
});

Template.HashrateAPI.helpers({
  hashpowerunits () {
    return "units";
  },
  expires () {
    return moment(Bounties.findOne().expiresAt).fromNow();
  },
  thisbounty () {
    return Bounties.findOne();
  }
});

Template.HashrateAPI.events({
  'click .submit': function () {
    //Functions to check data:
    //Hashrate
    var checkHashrateCall = function () {
      if ($('#apiCall').val() == "https://moneroblocks.info/api/get_stats") {
        sAlert.error("Looks like you haven't updated the form and you're trying to submit the example data! Please try again.", {stack: false, position: 'top'});
      } else if (!parseInt($('#hashrate-result').text())) {
        sAlert.error("Looks like you haven't found the hashrate! Please try again.", {stack: false, position: 'top'});
      } else {
        hashrateCall = true;
        apiData.apiCall = $('#apiCall').val();
        apiData.hashrate = $('#hashrate').val();
        apiData.bountyId = FlowRouter.getParam("_id");
      }
    };
    // Blockchain height
    var checkBlockchainHeight = function () {
      if ($('#height-result').text()) {
        apiData.height = $('#height').val();
      }
    };
    // Timestamp
    var checkTimestamp = function () {
      if ($('#timestamp-result').text()) {
        apiData.timestamp = $('#timestamp').val();
      }
    };
    //Block Reward
    var checkBlockReward = function () {
      if ($('#reward-result').text()) {
        apiData.reward = $('#reward').val();
        apiData.decimal = Math.pow(10, parseInt($('#decimal').val()));
      }
    };
    //Total Coins
    var checkTotalCoins = function () {
      if ($('#emission-result').text()) {
        apiData.emissions = $('#emission').val();
        apiData.decimal = Math.pow(10, parseInt($('#decimal').val()));
      }
    }

    var apiData = {};
    var hashrateCall = false;
    checkHashrateCall();
    checkBlockchainHeight();
    checkTimestamp();
    checkBlockReward();
    checkTotalCoins();
    if (hashrateCall) {
      Meteor.call('completeAPIbounty', apiData, function(error, result) {
        if (error) {
          sAlert.error(error.reason, {stack: false, position: 'top'});
        };
        Cookies.set('workingBounty', false);
        Cookies.set('bountyItem', null);
        Cookies.set('bountyType', null);
        Cookies.set('expiresAt', null);
        //Meteor.call('cancelBounty', FlowRouter.getParam("_id"));
        //FlowRouter.go("/mypending");
      })
    };


  },
  'click .fetch': function() {
    var d = $('#apiCall').val();
    var parser = $('#hashrate').val();
    var decimal = Math.pow(10, parseInt($('#decimal').val()));
    //console.log(parser);
    fetch("https://cors-anywhere.herokuapp.com/" + d).then(function(result) {
  return result.json();
}).then(function(data) {
  //$('#result').html("");
  $('#hashrate-result').text(" ");
  $('#height-result').text(" ");
  $('#timestamp-result').text(" ");
  $('#reward-result').text(" ");
  $('#emission-result').text(" ");

  $('#hashrate-result').text(Math.round(eval($('#hashrate').val())));
  $('#height-result').text(eval($('#height').val()));
  $('#timestamp-result').text(eval($('#timestamp').val()));
  $('#reward-result').text(eval($('#reward').val()) / decimal);
  $('#emission-result').text(Math.round(eval($('#emission').val()) / decimal));
  $('#result').html(JSON.stringify(data));
  $('#result').rainbowJSON();
  var emission = eval($('#emission').val());

  console.log(decimal);
  var emission = emission / decimal;

  console.log("----processing result----");
  console.log("This will return the result of the API query and parse it through the filter you have provided ( " + parser + " ) WITHOUT Math.round(), this is so that you can see the entire JSON object for diagnostics.");
  console.log(eval(parser));
  console.log("----done----");
  console.log(emission);
});
  }
});

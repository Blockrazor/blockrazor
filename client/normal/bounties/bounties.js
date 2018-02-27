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

  this.currencyTime = new ReactiveVar(0)

  Meteor.call('getLastCurrency', (err, data) => {
    this.currencyTime.set(data.approvedTime)
  })

  this.hashTime = new ReactiveVar(0)

  Meteor.call('getLastHashPower', (err, data) => {
    this.hashTime.set(data.createdAt || Date.now())
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
    return _.union(Bounties.find({pendingApproval: false}).fetch(), [{
      problem: 'Blockrazor needs new currencies',
      solution: 'Add a new currency now',
      types: {
        heading: 'Add a new currency',
        rules: 'If you accept this bounty, you\'ll have 60 minutes to complete it and add a new currency for the given reward. If the bounty expires, you\'ll still be credited, but the reward is not guaranteed after 60 minutes.'
      },
      creationTime: Template.instance().currencyTime.get(),
      multiplier: 1.8,
      currentlyAvailable: true,
      currencyName: 'Blockrazor',
      _id: 'new-currency'
    }, {
      problem: 'Blockrazor needs new hash power data',
      solution: 'Add new hash power data now',
      types: {
        heading: 'Add new hash power data',
        rules: 'If you accept this bounty, you\'ll have 30 minutes to complete it and add new hash power data for the given reward. If the bounty expires, you\'ll still be credited, but the reward is not guaranteed after 30 minutes.'
      },
      creationTime: Template.instance().hashTime.get(),
      multiplier: 0.9,
      currentlyAvailable: true,
      currencyName: 'Blockrazor',
      _id: 'new-hashpower'
    }]).sort((i1, i2) => {
      return calculateReward.call(i2, Template.instance().now.get()) - calculateReward.call(i1, Template.instance().now.get())
    })
  }
});

Template.bountyRender.onCreated(function(){
  this.autorun(() => {
    this.subscribe('bountytypes');
  });
})

const calculateReward = function(now) {
  return (((now - this.creationTime) / REWARDCOEFFICIENT) * (this.multiplier || 1)).toFixed(6)
}

const canContinue = (id) => {
  if (id === 'new-currency' || id === 'new-hashpower') {
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
    if(this.currentlyAvailable == true) {
        return "btn-outline-primary takeBounty";
    } else { return "btn-outline-secondary";}
  },
  reward: function () {
    return calculateReward.call(this, Template.instance().view.parentView.parentView.parentView.templateInstance().now.get())
  }
});

Template.bountyRender.events({
  'click .start': function () {
    if (canContinue('new-currency')) {
      FlowRouter.go('/addCoin')
    } else if (canContinue('new-hashpower')) {
      FlowRouter.go('/add-hashpower')
    } else {
      if(Cookies.get('workingBounty') != "true") {
        Template.instance().view.parentView.parentView.parentView.templateInstance().workingBounty.set(true);
        Cookies.set('workingBounty', true, { expires: 1 });
        Cookies.set('expiresAt', Date.now() + 3600000, { expires: 1 }); //
        //Session.set('bountyItem', this._id);
        Cookies.set('bountyItem', this._id, { expires: 1});
        Cookies.set('bountyType', this.bountyType, { expires: 1});
        Template.instance().view.parentView.parentView.parentView.templateInstance().bountyType.set(this.bountyType);
        if (this._id === 'new-currency') {
          Meteor.call('addCurrencyBounty', calculateReward.call(this, Date.now()))
          FlowRouter.go('/addCoin')
        } else if (this._id === 'new-hashpower') {
          Meteor.call('addHashPowerBounty', calculateReward.call(this, Date.now()))
          FlowRouter.go('/add-hashpower')
        } else {
          Meteor.call('startBounty', this._id)
          FlowRouter.go("/bounties/" + this._id)
        }
      } else if (Cookies.get('workingBounty') == "true") {
        sAlert.error("You already have a bounty in progress!");
        if (this._id === 'new-currency') {
          FlowRouter.go('/addCoin')
        } else if (this._id === 'new-hashpower') {
          FlowRouter.go('/add-hashpower')
        } else {
          FlowRouter.go("/bounties/" + Cookies.get('bountyItem'))          
        }
      }
    }

  },
  'click .cancel': function() {
    if (this._id === 'new-currency') {
      Meteor.call('deleteCurrencyBountyClient', (err, data) => {})
      Cookies.set('workingBounty', false, { expires: 1 })
    }
    if (this._id === 'new-hashpower') {
      Meteor.call('deleteHashPowerBountyClient', (err, data) => {})
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

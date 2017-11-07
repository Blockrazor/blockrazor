import { Template } from 'meteor/templating';
import './rainbow.js';
import { Bounties, BountyTypes } from '../../../lib/database/Bounties.js';
const REWARDCOEFFICIENT = 60000000;

Template.bounties.onCreated(function(){
  this.autorun(() => {
    this.subscribe('bounties');
  });
});

Template.bounties.onRendered(function(){
  Session.set('workingBounty', false);
  Meteor.setInterval(function() {
      Session.set('now', Date.now());
  }, 10);
});


Template.bounties.helpers({
  bounties: function() {
    return Bounties.find();
  }
});

Template.bountyRender.onCreated(function(){
  this.autorun(() => {
    this.subscribe('bountytypes');
  });
});

Template.bountyRender.helpers({
  types: function () {
    return BountyTypes.findOne();
  },
  id: function() {
    return this._id;
  },
  workingText: function () {
    if(this.currentlyAvailable == false) {
        return this.currentUsername + " is working on this right now!";
    } else { return null;}
  },
  buttonClass: function() {
    if(this.currentlyAvailable == true) {
        return "btn-outline-primary takeBounty";
    } else { return "btn-outline-secondary";}
  },
  reward: function () {
    return ((Session.get('now') - this.creationTime) / REWARDCOEFFICIENT).toFixed(6);
  }
});

Template.bountyRender.events({
  'click .start': function () {
    if(Cookies.get('workingBounty') != "true") {
      Session.set('workingBounty', true);
      Cookies.set('workingBounty', true, { expires: 1 });
      Cookies.set('expiresAt', Date.now() + 3600000, { expires: 1 }); //
      //Session.set('bountyItem', this._id);
      Cookies.set('bountyItem', this._id, { expires: 1});
      Cookies.set('bountyType', this.bountyType, { expires: 1});
      Session.set('bountyType', this.bountyType);
      Meteor.call('startBounty', this._id);
      FlowRouter.go("/bounties/" + this._id);
    } else if (Cookies.get('workingBounty') == "true") {
      sAlert.error("You already have a bounty in progress!");
      FlowRouter.go("/bounties/" + Cookies.get('bountyItem'));
    }

  },
  'click .cancel': function() {
    $('#' + this._id).hide();
    $('#takeBounty' + this._id).show();
  },
  'click .takeBounty': function() {
    $('#' + this._id).show();
    $('#takeBounty' + this._id).hide();
  }
})

Template.activeBounty.onRendered(function(){
  Session.set('bountyType', Cookies.get('bountyType'));
  Meteor.setInterval(function() {
      Session.set('now', Date.now());
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
});Session.set('activeBountyRendered', true);

Template.activeBounty.helpers({
  timeRemaining () {

    return "Time remaining: " + Math.round((Bounties.findOne({
      _id: Cookies.get('bountyItem')
    }).expiresAt - Session.get('now'))/1000/60) + " minutes.";
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
        FlowRouter.go("/mypending");
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

import { Template } from 'meteor/templating';
import './rainbow.js';
const REWARDCOEFFICIENT = 60000000;

Template.bounties.onRendered(function(){
  Session.set('workingBounty', false);
  Meteor.setInterval(function() {
      Session.set('now', Date.now());
  }, 10);
});


Template.bounties.helpers({
  activebounty: function () {
    return [{
      _id: "23562356",
      currencyName: "Bitcoin",
      bountyType: "API",
      creationTime: 1509781011000,
      currentlyAvailable: true,
      currentUsername: null
    }];
  },
  bounties: function() {
    return [{
      _id: "23562356",
      currencyName: "Bitcoin",
      bountyType: "API",
      creationTime: 1509781011000,
      currentlyAvailable: true,
      currentUsername: null
    },
    {
      _id: "43564546",
      currencyName: "Dash",
      bountyType: "API",
      creationTime: 1509776537000,
      currentlyAvailable: false,
      currentUsername: "Roger Ver"
    }];
  }
});

Template.bountyRender.helpers({
  id: function() {
    return this._id;
  },
  bountyDetails: function () {
    return "After clicking start, you will have 30 minutes to complete this bounty. You need to: [1] find a block explorer or open node which can provide the current network hash rate, [2] construct an API call to get the current hash rate, and [3] tell Blockrazor how to consume the response so that the final result is an integer."//DB call to get bounty details for this bounty type
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
  bountyTypeHeading: function () {
    return "Find and provide API call details"; //find the description for this.bountyType bounty type in DB
  },
  problem: function () {
    return "Blockrazor doesn't know how to get the current hash power for"; //find problem description for this.bountyType from DB
  },
  solution: function () {
    return "find a block explorer or open node and provide the API call (and the response object details) so that Blockrazor can keep itself updated"; //as above
  },
  reward: function () {
    return ((Session.get('now') - this.creationTime) / REWARDCOEFFICIENT).toFixed(6);
  }
});

Template.bountyRender.events({
  'click .start': function () {
    Session.set('workingBounty', true);
    //Session.set('bountyItem', this._id);
    Cookies.set('bountyItem', this._id, { expires: 1});
    Cookies.set('bountyType', this.bountyType, { expires: 1});
    Session.set('bountyType', this.bountyType);
    //Meteor.call('startBounty', this._id); //Make a meteor call to change the status of the bounty to being worked on by <username> and add "working on bounty" to their profile so they cant take another one at the same time.
    FlowRouter.go("/bounties/" + this._id);
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

});

Template.activeBounty.helpers({
  thisbounty () {
    return FlowRouter.getParam("_id");
  },
  thisitem: function () {
//    console.log(this.data._id);
    return "sdfgsdfg";
  }
});
Template.activeBounty.events({});

Template.APIbounty.events({
  'click .fetch': function() {
    var d = $('#apiCall').val();
    var parser = $('#hashrate').val();
    var decimal = Math.pow(10, parseInt($('#decimal').val()));
    //console.log(parser);
    fetch("https://cors-anywhere.herokuapp.com/" + d).then(function(result) {
  return result.json();
}).then(function(data) {
  //$('#result').html("");
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

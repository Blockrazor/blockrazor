import { Template } from 'meteor/templating';
const REWARDCOEFFICIENT = 100000000;

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
  'click .takeBounty': function() {
    $('#' + this._id).show();
    $('#takeBounty' + this._id).hide();
    //Session.set('workingBounty', true);
    Session.set('bountyItem', this._id);
  }
})

Template.activeBounty.helpers({});
Template.activeBounty.events({
  'click .cancel': function() {
    Session.set('workingBounty', false);
  }
});

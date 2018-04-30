import { Template } from 'meteor/templating';
import { Bounties } from '/imports/api/indexDB.js';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';;
import Cookies from 'js-cookie';

import './HashrateAPI.html'


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

import { Template } from 'meteor/templating';
import { Currencies, ChangedCurrencies } from '../../../../lib/database/Currencies.js';

import '../../../api/coins/methods.js';
import '../../layouts/MainBody.html'
import './changedCurrencies.html';

Template.changedCurrencies.onCreated(function bodyOnCreated() {
    var self = this
    self.autorun(function() {
        self.subscribe('changedCurrencies');
    })
});
//Events
Template.changedCurrencies.events({
    'click #currencyVoteBtnUp': function(e) {
        let voteType = e.currentTarget.id;

        Meteor.call('voteOnCurrencyChange', voteType, this, function(error, result) {
            if (error.error == 'moderatorOnlyAction') {
                sAlert.error('Only moderators can vote');
            }
            if (result == 'merged') {
                sAlert.success('Success, proposed change has been merged');
            }
        });
    },
    'click #currencyVoteBtnDown': function(e) {

        let voteType = e.currentTarget.id;
        Meteor.call('voteOnCurrencyChange', voteType, this, function(error, result) {
            if (error.error == 'moderatorOnlyAction') {
                sAlert.error('Only moderators can vote');
            }
        });
    }
})

//Helpers
Template.changedCurrencies.helpers({
    changedCurrencies() {

        return ChangedCurrencies.find({});

    },
    checkType(val) {
        if (val) {
            if (typeof val == "string") {
                return val;
            } else if (typeof val == "object") {
                return JSON.stringify(val);
            } else if (typeof val == "number") {
                return val;
            }
        } else {
            return 'NULL'
        }
    },
    voteType(id) {
        let isUpVote = ChangedCurrencies.findOne({ _id: id, 'voteMetrics.userId': Meteor.userId(), 'voteMetrics.voteType': 'upvote' }, { fields: { voteMetrics: 1 } });

        //Typically i'd use elemMatch here in mongoDB but we can't do this locally in meteor so let's use underscore _filter on the voteMetrics array
        if (isUpVote) {
            var voteExist = _.filter(isUpVote.voteMetrics, function(item) {
                return item.userId.indexOf(Meteor.userId()) != -1 && item.voteType.indexOf('upvote') != -1;
            });
            if (voteExist.length >= 1) {
                return true;
            } else {
                return false;
            }
        }
    },
    voted(id) {
        let voted = ChangedCurrencies.findOne({ _id: id, 'voteMetrics.userId': Meteor.userId() }, { fields: { voteMetrics: 1 } });
        if (voted) {
            var voteExist = _.filter(voted.voteMetrics, function(item) {
                return item.userId.indexOf(Meteor.userId()) != -1;
            });
            console.log(voteExist)
            if (voteExist.length >= 1) {
                return true;
            } else {
                return false;
            }
        }
    }
});
import { Template } from 'meteor/templating';
import { Currencies, ChangedCurrencies } from '../../../../lib/database/Currencies.js'

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
    'click #currencyVoteBtn': function(e) {

        Meteor.call('voteOnCurrencyChange', this)
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
    disableVoting(val) {

        let alreadyVoted = ChangedCurrencies.find({ _id: val._id, 'voteMetrics.userId': Meteor.userId() }).count();

        if (alreadyVoted) {
            return 'disabled';
        } else if (val.status == 'merged') {
            return 'disabled';
        }
    }
});
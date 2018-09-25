import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Currencies, ChangedCurrencies, HashAlgorithm } from '/imports/api/indexDB.js';

import './changedCurrencies.html';

Template.changedCurrencies.onCreated(function () {
    var self = this

    self.autorun(function() {
        SubsCache.subscribe('changedCurrencies')
        SubsCache.subscribe('hashalgorithm')
    });
});

//Events
Template.changedCurrencies.events({
    
})

//Helpers
Template.changedCurrencies.helpers({
    changedCurrency () {
        return _.sample(ChangedCurrencies.find({ 
            "createdBy" : { $ne : Meteor.userId() },
            "voteMetrics" : { 
                "$not" : { 
                    "$elemMatch" : { "userId" : Meteor.userId()  } 
                } 
            } 
        }).fetch());
    },
    nextChangedCurrency (change) {
        if (change === undefined) {
            return TAPi18n.__('moderator.changedCurrencies.no_more')    
        } else {
            FlowRouter.go('/moderator/changedCurrencies/' + change._id);
        }    
    }
});

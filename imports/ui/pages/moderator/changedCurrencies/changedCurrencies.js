import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Currencies, ChangedCurrencies, HashAlgorithm } from '/imports/api/indexDB.js';

// import '../../../api/coins/methods.js'; //is broken adress
import '../../../layouts/MainBody.html'
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
        return _.sample(ChangedCurrencies.find({ "createdBy" : { $ne : Meteor.userId() } }).fetch());
    },
    nextChangedCurrency (change) {
        if (change === undefined) {
            return "No more changes to approve"    
        } else {
            FlowRouter.go('/moderator/changedCurrencies/' + change._id);
        }    
    }
});

import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Currencies, ChangedCurrencies, HashAlgorithm } from '/imports/api/indexDB.js';

import './changedCurrency.html';

var nextChangedCurrency = function () {
    var currentId = FlowRouter.getParam('id');
    var sample = _.sample(ChangedCurrencies.find({ 
        '_id' : { $ne : currentId }, 
        "createdBy" : { $ne : Meteor.userId() },
        "voteMetrics" : { 
            "$not" : { 
                "$elemMatch" : { "userId" : Meteor.userId()  } 
            } 
        }
    }).fetch());

    setTimeout(function () {
        if (sample === undefined) {
            FlowRouter.go('/moderator/changedCurrencies');    
        } else {
            FlowRouter.go('/moderator/changedCurrencies/' + sample._id);    
        }
        
    }, 300);
};

Template.changedCurrency.onCreated(function bodyOnCreated() {
    var self = this;
    self.autorun(function() {
        SubsCache.subscribe('changedCurrencies')
        SubsCache.subscribe('hashalgorithm')
    })
});

//Events
Template.changedCurrency.events({
    'click #currencyVoteBtnUp': function(e) {
        let voteType = e.currentTarget.id;

        Meteor.call('voteOnCurrencyChange', voteType, this, function(error, result) {

            if (error && error.error == 'moderatorOnlyAction') {
                sAlert.error(TAPi18n.__('moderator.changedCurrencies.only_mods'));
            }else if (error && error.error == 'noVoteOnOwn') {
                sAlert.error(TAPi18n.__('moderator.changedCurrencies.own_change'));
            }

            if (result == 'merged') {
                sAlert.success(TAPi18n.__('moderator.changedCurrencies.success'));
                nextChangedCurrency();
            }
        });
    },
    'click #currencyVoteBtnDown': function(e) {

        let voteType = e.currentTarget.id;
        Meteor.call('voteOnCurrencyChange', voteType, this, function(error, result) {
            if (error && error.error == 'moderatorOnlyAction') {
                sAlert.error(TAPi18n.__('moderator.changedCurrencies.only_mods'));
            }
            if (result == 'deleted') {
                sAlert.success(TAPi18n.__('moderator.changedCurrencies.deleted'));
                nextChangedCurrency();
            }
        });
    },
    'click #skipChange': function (e) {
        nextChangedCurrency();
    }
})

//Helpers
Template.changedCurrency.helpers({
    changedCurrencies() {
        return ChangedCurrencies.find({});
    },

    changedCurrency() {
        return ChangedCurrencies.findOne({ _id: FlowRouter.getParam('id') });
    },

    checkType(val) {
        if (val) {
            if (typeof val == "string") {
                //check if it is image else show the string
                if (_.contains(['png', 'gif', 'jpg', 'jpeg'], val.split('.').pop())){
                    let a = val.split('.');
                    let thumbnail = a[0] + '_thumbnail.' + a[1];
                    return '<img class="_50x50" src="'+_coinUpoadDirectoryPublic+thumbnail+'">';
                }else{
                    if (this.field === 'hashAlgorithm') { // show algorithm name
                        if (val === this.new || val === this.old) {
                            let algo = HashAlgorithm.findOne({
                                _id: val
                            })

                            return algo ? `${algo.name}` : val
                        }
                    }

                    return val;
                }
                     
            } else if (typeof val == "object") {
                return JSON.stringify(val);
            } else if (typeof val == "number") {
                if (this.field === 'genesisTimestamp') {
                    if (val === this.new || val === this.old) {
                        return moment(val).format(_globalDateFormat)
                    }
                }
                
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
            if (voteExist.length >= 1) {
                return true;
            } else {
                return false;
            }
        }
    }
});
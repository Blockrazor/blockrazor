import { Template } from 'meteor/templating';
import { Currencies, ChangedCurrencies, HashAlgorithm } from '/imports/api/indexDB.js';

// import '../../../api/coins/methods.js'; //is broken adress
import '../../../layouts/MainBody.html'
import './changedCurrencies.html';

Template.changedCurrencies.onCreated(function bodyOnCreated() {
    var self = this
    self.autorun(function() {
        SubsCache.subscribe('changedCurrencies')
        SubsCache.subscribe('hashalgorithm')
    })
});
//Events
Template.changedCurrencies.events({
    'click #currencyVoteBtnUp': function(e) {
        let voteType = e.currentTarget.id;

        Meteor.call('voteOnCurrencyChange', voteType, this, function(error, result) {

            if (error && error.error == 'moderatorOnlyAction') {
                sAlert.error('Only moderators can vote');
            }else if (error && error.error == 'noVoteOnOwn') {
                sAlert.error('You can not vote on your own proposed change');
            }

            if (result == 'merged') {
                sAlert.success('Success, proposed change has been merged');
            }
        });
    },
    'click #currencyVoteBtnDown': function(e) {

        let voteType = e.currentTarget.id;
        Meteor.call('voteOnCurrencyChange', voteType, this, function(error, result) {
            if (error && error.error == 'moderatorOnlyAction') {
                sAlert.error('Only moderators can vote');
            }
            if (result == 'deleted') {
                sAlert.success('Proposed change has been deleted');
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
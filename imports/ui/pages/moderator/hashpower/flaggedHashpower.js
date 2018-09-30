import { Template } from 'meteor/templating';
import { HashHardware, HashPower, HashAlgorithm, HashUnits } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import './flaggedHashpower.html'

var nextFlaggedHashpower = function () {
    var currentId = FlowRouter.getParam('id');
    var sample = _.sample(HashPower.find({ 
		'_id' : { $ne : currentId }, 
		'flags.0': { $exists: true },
		"votes" : { 
			"$not" : { 
				"$elemMatch" : { "userId" : Meteor.userId()  } 
			} 
		},
		"createdBy" : { $ne : Meteor.userId() }
    }).fetch());

    setTimeout(function () {
        if (sample === undefined) {
            FlowRouter.go('/moderator/flagged-hashpower');    
        } else {
            FlowRouter.go('/moderator/flagged-hashpower/' + sample._id);    
        }
        
    }, 300);
};

Template.flaggedHashpower.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('flaggedhashpower')
		SubsCache.subscribe('hashhardware')
		SubsCache.subscribe('hashalgorithm')
		SubsCache.subscribe('hashunits')
	})

	this.flags = new ReactiveVar([])
})

Template.flaggedHashpower.helpers({
	flaggedHashpower() {
        return HashPower.findOne({ _id: FlowRouter.getParam('id') });
    },
	hashpower: () => HashPower.find({
		'flags.0': { // if array has more than 0 elements
 			$exists: true
 		}
	}).fetch(),
	hashDevice: function() {
		return (HashHardware.findOne({
			_id: this.device
		}) || {}).name || ''
	},
	hashAlgorithm: function() {
		return (HashAlgorithm.findOne({
			_id: this.hashAlgorithm
		}) || {}).name || ''
	},
	unit: function() {
		return (HashUnits.findOne({
			_id: this.unit
		}) || {}).name || ''
	},
	image: function() {
	    if (this.image) {
	        return `${_hashPowerUploadDirectoryPublic}${this.image}`
	    } else {
	        return '/codebase_images/noimage.png'
	    }
	},
	voted: function() {
		return !!(this.votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return this.upvotes || 0
	},
	downvotes: function() {
		return this.downvotes || 0
	}
})

Template.flaggedHashpower.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('hashPowerVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.hashpower.only_mod'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.hashpower.success'))
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.hashpower.deleted'))
            }
        })
	},
	'click #skipChange': function (e) {
        nextFlaggedHashpower();
    }
})
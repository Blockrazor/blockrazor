import { Template } from 'meteor/templating';
import { HashHardware, HashPower, HashAlgorithm, HashUnits } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import './flaggedHashpowers.html'

Template.flaggedHashpowers.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('flaggedhashpower')
		SubsCache.subscribe('hashhardware')
		SubsCache.subscribe('hashalgorithm')
		SubsCache.subscribe('hashunits')
	})

	this.flags = new ReactiveVar([])
})

Template.flaggedHashpowers.helpers({
    nextFlaggedHashpower (flagged) {
        FlowRouter.go('/moderator/flagged-hashpower/' + flagged._id);
    },
    flagged () {
        return _.sample(HashPower.find({
            'flags.0': { // if array has more than 0 elements
                 $exists: true
			},
			"votes" : { 
				"$not" : { 
					"$elemMatch" : { "userId" : Meteor.userId()  } 
				} 
			}
        }).fetch());
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

Template.flaggedHashpowers.events({
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
    }
})
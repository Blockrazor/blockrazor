import { Template } from 'meteor/templating'
import { Features, Redflags } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './flaggedItem.html'

const collections = { Features, Redflags }

const getCollectionKlass = (collection) => {
    return collection.replace(collection[0], collection[0].toUpperCase())
}

const nextFlaggedItem = (klass) => {
    var nextCollections = _.omit(collections, klass)
    var objectKeys = _.shuffle(Object.keys(nextCollections))
	var nextFlagged = []

		for (let index = 0; index < objectKeys.length; index++) {
			const element = objectKeys[index];
			nextFlagged = nextCollections[element].find({ 
                flagRatio: { $gt: 0.6 },
                "mod.votes" : { "$not" : { "$elemMatch" : { "userId" : Meteor.userId()  } } } 
            }).fetch();

			if (nextFlagged.length > 0) { 
				const sample = _.sample(nextFlagged)
				FlowRouter.go('/moderator/flagged/' + element.toLowerCase() + '/' + sample._id)
				break 
			}
		}

        FlowRouter.go('/moderator/flagged')
		return
}

Template.flaggedItem.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('features')
		SubsCache.subscribe('redflags')
		SubsCache.subscribe('users')
    })
})

Template.flaggedItem.helpers({
	flaggedItem: () => {
        const klass = getCollectionKlass(FlowRouter.getParam('collection'))
        return collections[klass].findOne({ _id: FlowRouter.getParam('id') })
    },
	pardons: () => UserData.find({
		'pardon.status': 'new'
	}),
	username: function() {
		return (Meteor.users.findOne({
			_id: this.createdBy
		}) || {}).username
	},
	text: function() {
		return this.featureName || this.comment || this.name // something has to be defined
	},
	voted: function() {
		return !!((this.mod || {}).votes || []).filter(i => i.userId === Meteor.userId()).length
	},
	upvotes: function() {
		return (this.mod || {}).upvotes || 0
	},
	downvotes: function() {
		return (this.mod || {}).downvotes || 0
	}
})

Template.flaggedItem.events({
	'click .js-vote': function(event, templateInstance) {
        let type = $(event.currentTarget).data('vote')

        Meteor.call('flaggedVote', this._id, type, this.comment ? 'comment' : (this.featureName ? 'features' : 'redflags'), (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.flagged.only_mod'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.flagged.deleted'))
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.flagged.removed'))
            }
        })

        const klass = getCollectionKlass(FlowRouter.getParam('collection'))
        nextFlaggedItem(klass)
    },

    'click #nextFlaggedItem': (event) => {
        const klass = getCollectionKlass(FlowRouter.getParam('collection'))
        nextFlaggedItem(klass)
    }
})
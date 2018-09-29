import { Template } from 'meteor/templating';
import { Translations } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './translation.html'

import { flatten } from '/imports/ui/pages/translations/translations'
import { nextTranslation } from './translations'

Template.modTranslation.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('translations')
	})
})

Template.modTranslation.helpers({
	translation: () => Translations.findOne({
		_id: FlowRouter.getParam('id')
	}),
	translations: function() {
		let data = flatten(this.data)

		return Object.keys(data).map(i => ({
			key: i,
			value: data[i],
			english: TAPi18n.__(i, {
				lang: 'en'
			})
		})) 
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

Template.modTranslation.events({
	'click .js-vote': function(event, templateInstance) {
		event.preventDefault()

        let type = $(event.currentTarget).data('vote')

        Meteor.call('translationVote', this._id, type, (err, data) => {
            if (err && err.error === 'mod-only') {
                sAlert.error(TAPi18n.__('moderator.translation.only_mod'))
            }

            if (data === 'ok') {
                sAlert.success(TAPi18n.__('moderator.translation.approved'))
            } else if (data === 'not-ok') {
            	sAlert.success(TAPi18n.__('moderator.translation.deleted'))
            }

            if (!err) {
            	nextTranslation(this._id)
            }
        })
    },
    'click #skipChange': function(event, templateInstance) {
    	event.preventDefault()

    	nextTranslation(this._id)
    }
})
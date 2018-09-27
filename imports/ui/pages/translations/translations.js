import { Template } from 'meteor/templating'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './translations.html'

import swal from 'sweetalert2'
import xss from 'xss'

const flatten = (source, flattened = {}, keySoFar = '') => {
  	const getNextKey = (key) => `${keySoFar}${keySoFar ? '.' : ''}${key}`

  	if (typeof source === 'object') {
    	for (const key in source) {
      		flatten(source[key], flattened, getNextKey(key))
    	}
  	} else {
    	flattened[keySoFar] = source
  	}

  	return flattened
}

export { flatten }

Template.translations.onCreated(function() {
	this.scopes = new ReactiveVar([])
	this.currentData = new ReactiveVar({})
	this.currentLanguage = new ReactiveVar({})
	this.translatedData = new ReactiveVar({})

	Meteor.call('getLanguageScopes', 'en', (err, data) => {
		this.scopes.set(data)
	})
})

Template.translations.helpers({
	langs: () => {
		let langs = Object.keys(TAPi18n.languages_names).filter(i => i !== 'en') // english shouldn't be on the list
		langs = _.union(langs, ['de', 'es', 'ru', 'fr', 'zh']) // fallback
		langCodes = {
			de: 'Deutsch',
			es: 'Español',
			ru: 'Русский язык',
			fr: 'Français',
			zh: '普通話'
		}

		return langs.sort().map(i => {
			let lang = TAPi18n.languages_names[i] || []

			return {
				code: i,
				name: lang[1] || lang[1] || langCodes[i]
			}
		})
	},
	scopes: () => {
		return Template.instance().scopes.get()
	},
	translations: () => {
		let data = Template.instance().currentData.get()
		let translated = Template.instance().translatedData.get()

		if (data && data.data) {
			data = flatten(data.data)
		}

		if (translated) {
			translated = flatten(translated)
		}

		if (Object.keys(data).length && Object.keys(Template.instance().currentLanguage.get()).length) {
			return Object.keys(data).map(i => ({
				key: i,
				english: data[i],
				translated: translated[i] || ''
			}))
		}

		return []
	},
	language: () => Template.instance().currentLanguage.get().name || ''
})

Template.translations.events({
    'change .view-scope': (event, templateInstance) => {
    	event.preventDefault()

    	Meteor.call('getLanguageData', $(event.currentTarget).val(), 'en', (err, data) => {
    		if (!err) {
	    		templateInstance.currentData.set({
	    			scope: $(event.currentTarget).val(),
	    			data: data
	    		})
    		} else {
    			templateInstance.currentData.set({})
    		}
    	})

    	if (templateInstance.currentLanguage.get().key) {
    		Meteor.call('getLanguageData', $(event.currentTarget).val(),  templateInstance.currentLanguage.get().key, (err, data) => {
	    		if (!err) {
		    		templateInstance.translatedData.set(data)
	    		} else {
	    			templateInstance.translatedData.set({})
	    		}
	    	})
    	}
	},
	'change .language': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.currentLanguage.set({
			key: $(event.currentTarget).val(),
			name: $(event.currentTarget).find('option:selected').text()
		})

		Meteor.call('getLanguageData', templateInstance.currentData.get().scope,  $(event.currentTarget).val(), (err, data) => {
    		if (!err) {
	    		templateInstance.translatedData.set(data)
    		} else {
    			templateInstance.translatedData.set({})
    		}
    	})
	},
	'click .save-data': (event, templateInstance) => {
		event.preventDefault()

		let data = {}
		Array.from($('input')).forEach(el => {
			let e = $(el)

			if (e.val()) {
				data[e.attr('id')] = xss(e.val()) // sanitize html
			}
		})

		Meteor.call('saveLanguageData', templateInstance.currentData.get().scope, templateInstance.currentLanguage.get().key, templateInstance.currentLanguage.get().name, data, (err, data) => {
			if (!err) {
				swal('Successfully saved.')

				$('.view-scope').val('-')
				templateInstance.currentData.set({})
			}
		})
	}
})

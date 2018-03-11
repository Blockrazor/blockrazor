import { Template } from 'meteor/templating'
import {FlowRouter} from 'meteor/staringatlights:flow-router';
import './signin.html'

Template.signin.events({
	'click #js-facebook': (event, templateInstance) => {
		event.preventDefault()

		Meteor.loginWithFacebook({}, (err) => {
			if (!err) {
				FlowRouter.go(window.last || '/')
			} else {
				sAlert.error(err.message)
			}
		})
	},
	'click #js-github': (event, templateInstance) => {
		event.preventDefault()

		Meteor.loginWithGithub({}, (err) => {
			if (!err) {
				FlowRouter.go(window.last || '/')
			} else {
				sAlert.error(err.message)
			}
		})
	},
	'click #js-login': (event, templateInstance) => {
		event.preventDefault()

		Meteor.loginWithPassword({
			username: $('#js-email').val()
		}, $('#js-password').val(), (err) => {
			if (!err) {
				FlowRouter.go(window.last || '/')
			} else {
				sAlert.error(err.reason)
			}
		})
	}
})
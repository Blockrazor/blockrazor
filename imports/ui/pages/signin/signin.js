import { Template } from 'meteor/templating'
import {FlowRouter} from 'meteor/staringatlights:flow-router';
import './signin.html'
import './signin.scss'

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
	'submit #signIn': (event, templateInstance) => {
		event.preventDefault()

		Meteor.loginWithPassword({
			username: $('#email').val()
		}, $('#password').val(), (err) => {
			if (!err) {
				FlowRouter.go(window.last || '/')
			} else {
				sAlert.error(err.reason)
			}
		})
	}
})
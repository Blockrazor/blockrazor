import { Template } from 'meteor/templating'
import {FlowRouter} from 'meteor/ostrio:flow-router-extra'
import './twoFactor.html'
import './signin.scss'

Template.twoFactor.events({
	'submit #signIn': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('verify2fa', $('#token').val(), (err, data) => {
			if (!err && data) {
				FlowRouter.go('/')
			}
		})
	},
	'click #cancel-signin': (event) => {
		event.preventDefault()
		Meteor.logout()

		// using timeout function because for some reason 
		// the .logout callback doesn't seem to be working
		// setting timeout to 1 second allowing .logout 
		// request to complete
		setTimeout(() => {
			FlowRouter.go('/')
		}, 1000);
	}
})
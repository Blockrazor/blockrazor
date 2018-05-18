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
	}
})
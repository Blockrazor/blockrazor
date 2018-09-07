import { Template } from 'meteor/templating'
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import './signin.html'
import './signin.scss'

const trimInput = function (val) {
  return val.replace(/^\s*|\s*$/g, "");
}

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
				sAlert.error(TAPi18n.__(err.reason))
			}
		})
	}
})

Template.password_reset.events({
  'submit #password-reset'(e, template) {
    e.preventDefault();
    let forgotPasswordForm = template.$(e.currentTarget),
      email = trimInput(forgotPasswordForm.find('#email').val().toLowerCase());
    if (email && email !== '') {
      Accounts.forgotPassword({ email: email }, function (err) {
        if (err) {
          if (err.message === 'User not found [403]') {
            sAlert.error(err.message);
          } else {
            sAlert.error('We are sorry but something went wrong.');
          }
        } else {
          sAlert.success('Email Sent. Check your mailbox.');
        }
      });
    }
  }
})
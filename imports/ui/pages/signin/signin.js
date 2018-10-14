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
				FlowRouter.go(window.last || '/home')
			} else {
				sAlert.error(err.message)
			}
		})
	},
	'click #js-github': (event, templateInstance) => {
		event.preventDefault()

		Meteor.loginWithGithub({}, (err) => {
			if (!err) {
				FlowRouter.go(window.last || '/home')
			} else {
				sAlert.error(err.message)
			}
		})
  	},
  	'click #js-email' : (event) => {
    	event.preventDefault()
    	$('#signIn').toggleClass('d-none');
  	},
	'submit #signIn': (event, templateInstance) => {
		event.preventDefault()

		Meteor.loginWithPassword({
			username: $('#email').val()
		}, $('#password').val(), (err) => {
			if (!err) {
				FlowRouter.go(window.last || '/home')
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
            sAlert.error(TAPi18n.__('user.forgot.not_found'));
          } else {
            sAlert.error(TAPi18n.__('user.forgot.sorry'))
          }
        } else {
          sAlert.success(TAPi18n.__('user.forgot.sent'))
        }
      });
    }
  }
})
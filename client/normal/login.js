Template.login.events({
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
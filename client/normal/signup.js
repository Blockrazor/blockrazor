Template.signup.events({
	'click #js-signup': (event, templateInstance) => {
		event.preventDefault()

		if ($('#js-email').val() && $('#js-password').val()) {
			if ($('#js-password').val() === $('#js-password-conf').val()) {
				Accounts.createUser({
					username: $('#js-email').val(),
					email: $('#js-email').val(),
					password: $('#js-password').val()
				}, (err) => {
					if (!err) {
						FlowRouter.go(window.last || '/')
					} else {
						sAlert.error(err.reason)
					}
				})
			} else {
				sAlert.error('Passwords don\'t match!')
			}
		} else {
			sAlert.error('Fields can\'t be empty!')
		}
	}
})
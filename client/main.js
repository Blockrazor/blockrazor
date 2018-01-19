import { Accounts } from 'meteor/accounts-base';


Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

//Global helper to easily get session values in templates
Template.registerHelper( 'session', ( name ) => {
  return Session.get(name);
};

Accounts.onLogin(function(options) {

	//get notification count when a user logs in.
	Session.set('notificationCount',0);
    Meteor.call('getNotificationCount',
        (error, result) => {
            if (error) {
                console.error(error)
            } else {
                Session.set('notificationCount',result);
            }
        }
    );

});
import { Accounts } from 'meteor/accounts-base';


Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});


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

//get public coin image location
Template.registerHelper( '_coinUpoadDirectory', ( string ) => {
  return _coinUpoadDirectory;
});
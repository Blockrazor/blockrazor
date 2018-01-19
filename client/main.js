import { Accounts } from 'meteor/accounts-base';


Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

//Global helper to easily get session values in templates
Template.registerHelper( 'session', ( name ) => {
  return Session.get(name);
});
import { Template } from 'meteor/templating';
import { users } from '../../lib/database/user.js';
//var user = Meteor.subscribe('users');
Meteor.subscribe('users');
Template.user.helpers({
		UserName() {
	 	return  Meteor.user().services.github.username;
	 	
	 	}
	
});


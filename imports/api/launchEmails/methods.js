import { Meteor } from 'meteor/meteor'
import { launchEmails } from '/imports/api/indexDB.js'

Meteor.methods({
    'registerForLaunch': function(email) {

        if (email) {
            if (this.userId) {
                launchEmails.insert({
                    time: new Date().getTime(),
                    email: email,
                    userId: this.userId
                });
            } else {
                launchEmails.insert({
                    time: new Date().getTime(),
                    email: email
                });
            }


            return true;
        } else {
            throw new Meteor.Error('messages.launch.email');
        }

    }

});
import { check } from 'meteor/check'

//The Meteor.user() object does not publish email by default
Meteor.publish('_extendUser', function() {
    return Meteor.users.find({ _id: this.userId }, { fields: { email: 1, bio: 1 } });
});

Meteor.methods({
    'editProfile': function(data) {
        if (!this.userId) { throw new Meteor.Error('error', 'please log in') };

        //only update profile if data is true
        if (data) {
            //validate json objects are strings
            check(data.email, String);
            check(data.bio, String);
            check(data.username, String);

            Meteor.users.update({ _id: this.userId }, {
                    $set: {
                        email: data.email,
                        username: data.username,
                        bio: data.bio
                    }
                },
                function(error) {
                    console.log('editProfile method failed', error)
                });
        }

    }
});
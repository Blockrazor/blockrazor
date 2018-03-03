import { Template } from 'meteor/templating';

Template.viewprofile.onCreated(function() {
    this.autorun(() => {
        this.subscribe('userProfile')
        this.subscribe('_extendUser')
    })
});

Template.viewprofile.events({
    'submit #editProfile': (e) => {

        e.preventDefault();

        var email = e.target.email.value;
        var username = e.target.username.value;
        var bio = e.target.bio.value;
        var data = { email: email, bio: bio, username: username }

        Meteor.call('editProfile', data, (err, data) => {

            if (err) {
                console.log('error editing profile', err)
            } else {
                FlowRouter.go('/');
            }

        })
    },
});

Template.viewprofile.helpers({
    user: () => {
        return Meteor.user();
    }
});
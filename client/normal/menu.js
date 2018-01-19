Template.menu.events({
    'submit .fetch' (event) {
        event.preventDefault();
        Meteor.call('populateDatabase',
            (error, result) => {
                if (!error) {
                    console.log(result)
                }
            }
        );
    }
});

Template.menu.helpers({
    totalNotifications() {
        return Session.get('notificationCount');
    }
});

Template.menu.onCreated(function() {

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
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
        return Template.instance().totalNotificatins.get();
    }
});

Template.menu.onCreated(function() {

    this.totalNotificatins = new ReactiveVar(0);

    Meteor.call('getNotificationCount',
        (error, result) => {
            if (error) {
                console.error(error)
            } else {
                this.totalNotificatins.set(result);
            }
        }
    );

});
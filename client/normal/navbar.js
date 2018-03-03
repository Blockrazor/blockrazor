Template.topnav.events({
    // 'submit .fetch' (event) {
    //     event.preventDefault();
    //     Meteor.call('populateDatabase',
    //         (error, result) => {
    //             if (!error) {
    //                 console.log(result)
    //             }
    //         }
    //     );
    // },
    'click #js-logout': (event, templateInstance) => {
        Meteor.logout()
    }
});

Template.topnav.helpers({
    // totalNotifications() {
    //     return Template.instance().notificationCount.get();
    // }
});

Template.topnav.onCreated(function() {
    // this.notificationCount = new ReactiveVar(0)

    // // Tracks user status. If user logs in (or logs out), his notification count is updated, thus eliminating the need for Accounts.onLogin callback and code redundancy
    // Tracker.autorun(() => {
    //     if (Meteor.userId()) {
    //         Meteor.call('getNotificationCount',
    //             (error, result) => {
    //                 if (error) {
    //                     console.error(error)
    //                 } else {
    //                     this.notificationCount.set(result)
    //                 }
    //             }
    //         )
    //     }
    // })

});
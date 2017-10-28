Template.menu.events({
'submit .fetch' (event) {
event.preventDefault();
Meteor.call('populateDatabase',
(error, result) => {
if(!error) {
console.log(result)
}
}
);
}
});

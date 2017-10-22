Template.menu.events({
'submit .fetch' (event) {
event.preventDefault();
Meteor.call('fetchGitCommits', 'https://api.github.com/repos/monero-project/moneroii/stats/participation',
(error, result) => {
if(!error) {
console.log(result)
}
}
);
}
});

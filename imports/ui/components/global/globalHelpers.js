import { Template } from 'meteor/templating';
import { colStub } from '/imports/ui/components/compatability/colStub'

Bounties = colStub

import('/imports/api/bounties/bounties').then(b => {
	Bounties = b.Bounties

	colStub.change()
})

//global helpers are in /client/main.js, but truly belong in /imports/startup
var getBountyUrl = (bountyType) => {
	var url = '';

	switch (bountyType) {
		case 'new-currency':
			url = '/addCoin';
			break;
		case 'new-hashpower':
			url = '/add-hashpower';
			break;
		case 'new-codebase':
			url = '/codebase';
			break;
		case 'new-wallet':
			url = '/ratings';
			break;
		case 'new-community':
			url = '/communities';
			break;
		default:
			if (bountyType.split('-')[0] === 'currency') {
				let type = bountyType.split('-');
				let slug = type.splice(1, type.length).join('-');
				url = '/currency/' + slug;
			}

	}

	return url;
}

Template.registerHelper('bountyUrl', (bountyArr) => {
	// if bountyArr has items, get bountyType of first item and
	// call getBountyUrl on it
	if (bountyArr.length !== 0) { return getBountyUrl(bountyArr[0].type); }
	// otherwise return an empty string
	return '/bounties';
});

Template.registerHelper('hasBounties', (bountyArr) => {
	return bountyArr.length;
});

Template.registerHelper('activeBounties', () => {
	// get bounties associated with current user
	let bounties = Bounties.find({
		userId: Meteor.userId(), completed: false}, {
			sort: { expiresAt: -1 }
		}).fetch()

	// only return bounties whose expiry
	// is greater than current time
	return bounties.filter((bounty) => {
		return bounty.expiresAt > Date.now();
	});
});

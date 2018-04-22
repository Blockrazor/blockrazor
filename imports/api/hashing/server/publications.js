import { Meteor } from 'meteor/meteor'
import { HashAlgorithm, HashAverage, HashHardware, HashPower, HashPowerImages, HashUnits } from '/imports/api/indexDB.js'

Meteor.publish('hashalgorithm', () => HashAlgorithm.find({}))
Meteor.publish('hashaverage', () => HashAverage.find({}))
Meteor.publish('hashhardware', () => HashHardware.find({}))
Meteor.publish('hashpower', () => HashPower.find({}))
Meteor.publish('flaggedhashpower', () => HashPower.find({
  'flags.0': { // if array has more than 0 elements
    $exists: true
  }
}))
Meteor.publish('hashpowerimages', () => HashPowerImages.find({}))
Meteor.publish('hashunits', () => HashUnits.find({}))

Meteor.publish('bountyLastHash', () => {
	return HashPower.find({}, {
		sort: {
			createdAt: -1
		},
		limit: 1,
		fields: {
			createdAt: 1
		}
	})
})

import { Meteor } from 'meteor/meteor'
import { HashHardware } from '../../../lib/database/HashHardware'
import { HashPower } from '../../../lib/database/HashPower'
import { HashAlgorithm } from '../../../lib/database/HashAlgorithm'
import { HashUnits } from '../../../lib/database/HashUnits'
import { UserData } from '../../../lib/database/UserData'

Meteor.methods({
	addHashpower: (category, device, algo, hashrate, unit, power) => {
		const Future = require('fibers/future')
		const fut = {
			hw: new Future(), 
			algo: new Future(), 
			unit: new Future()
		}

		if (Meteor.userId()) {
			if (category && device && algo && hashrate && unit && power) {
				// if the hardware already exists, just continue, but if it doesn't, create it
				if (!HashHardware.findOne({
					_id: device
				})) {
					Meteor.call('addHardware', device, (err, data) => {
						if (!err) {
							fut.hw.return(data)
						} else {
							throw new Meteor.Error('Error.', err.reason)
						}
					})
				} else {
					fut.hw.return(device)
				}

				// if the algorithm already exists, just continue, but if it doesn't, create it
				if (!HashAlgorithm.findOne({
					_id: algo
				})) {
					Meteor.call('addAlgo', algo, (err, data) => {
						if (!err) {
							fut.algo.return(data)
						} else {
							throw new Meteor.Error('Error.', err.reason)
						}
					})
				} else {
					fut.algo.return(algo)
				}

				// if the unit already exists, just continue, but if it doesn't, create it
				if (!HashUnits.findOne({
					_id: unit
				})) {
					Meteor.call('addUnit', unit, (err, data) => {
						if (!err) {
							fut.unit.return(data)
						} else {
							throw new Meteor.Error('Error.', err.reason)
						}
					})
				} else {
					fut.unit.return(unit)
				}

				HashPower.insert({
					hashCategory: category,
					device: fut.hw.wait(),
					hashAlgorithm: fut.algo.wait(),
					hashRate: hashrate,
					unit: fut.unit.wait(),
					powerConsumption: power,
					createdBy: Meteor.userId()
				})
			} else {
				throw new Meteor.Error('Error.', 'Please fill all fields.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to log in first.')
		}
	},
	addHardware: (name) => {
		if (Meteor.userId()) {
			if (name) {
				return HashHardware.insert({
					name: name
				})
			} else {
				throw new Meteor.Error('Error.', 'Please fill all fields.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to log in first.')
		}
	},
	addAlgo: (name) => {
		if (Meteor.userId()) {
			if (name) {
				return HashAlgorithm.insert({
					name: name
				})
			} else {
				throw new Meteor.Error('Error.', 'Please fill all fields.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to log in first.')
		}
	},
	addUnit: (name) => {
		if (Meteor.userId()) {
			if (name) {
				return HashUnits.insert({
					name: name
				})
			} else {
				throw new Meteor.Error('Error.', 'Please fill all fields.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to log in first.')
		}
	},
	deleteHashpower: id => {
		if (Meteor.userId()) {
			let hp = HashPower.findOne({
				_id: id
			})

			if (hp) {
				if (hp.createdBy === Meteor.userId() || UserData.findOne({
					_id: Meteor.userId()
				}).moderator) {
					HashPower.remove({
						_id: id
					})
				} else {
					throw new Meteor.Error('Error.', 'Error ocurred while deleting.')
				}
			} else {
				throw new Meteor.Error('Error.', 'Wrong id.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to log in first.')
		}
	}
})
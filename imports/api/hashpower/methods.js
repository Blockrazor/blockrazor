import { Meteor } from 'meteor/meteor'
import { HashHardware } from '../../../lib/database/HashHardware'
import { HashPower } from '../../../lib/database/HashPower'
import { HashAlgorithm } from '../../../lib/database/HashAlgorithm'
import { UserData } from '../../../lib/database/UserData'

Meteor.methods({
	addHashpower: (category, device, algo, hashrate, unit, power) => {
		if (Meteor.userId()) {
			if (category && device && algo && hashrate && unit && power) {
				HashPower.insert({
					hashCategory: category,
					device: device,
					hashAlgorithm: algo,
					hashRate: hashrate,
					unit: unit,
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
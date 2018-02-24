import { Meteor } from 'meteor/meteor'
import { HashHardware } from '../../../lib/database/HashHardware'
import { HashPower } from '../../../lib/database/HashPower'
import { HashAlgorithm } from '../../../lib/database/HashAlgorithm'
import { HashUnits } from '../../../lib/database/HashUnits'
import { HashAverage } from '../../../lib/database/HashAverage'
import { UserData } from '../../../lib/database/UserData'
import { Currencies } from '../../../lib/database/Currencies'
import { parseString } from 'xml2js'

const parseUnit = unit => {
	let u = unit[0].toLowerCase()

	let o = {
		h: 1, // (H/s)
		s: 1, // (sol/s)
		k: 1000, // (kH/s)
		m: 1000000, // (MH/s)
		g: 1000000000, // (GH/s)
		t: 1000000000000, // (TH/s)
		p: 1000000000000000, // (PH/s)
		e: 1000000000000000000 // (EH/s)
	}

	return o[u]
}

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

				let al = fut.algo.wait()

				HashPower.insert({
					hashCategory: category,
					device: fut.hw.wait(),
					hashAlgorithm: al,
					hashRate: hashrate,
					unit: fut.unit.wait(),
					powerConsumption: power,
					createdBy: Meteor.userId()
				})

				Meteor.call('calculateAverage', al, (err, data) => {})
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
	},
	updateAverages: () => {
		HashAlgorithm.find({}).fetch().forEach(i => {
			Meteor.call('calculateAverage', i._id, (err, data) => {})
		})
	},
	calculateAverage: algorithm => {
		let algo = HashAlgorithm.findOne({
			_id: algorithm
		})

		let units = HashUnits.find({}).fetch()

		if (algo) {
			let pows = HashPower.find({
				hashAlgorithm: algo._id
			}).fetch()

			let total = 0

			pows.forEach(i => {
				total += parseInt(i.powerConsumption) / (parseInt(i.hashRate) * parseUnit(HashUnits.findOne({
					_id: i.unit
				}).name))
			})

			HashAverage.upsert({
				algorithm: algo._id
			}, {
				$set: {
					average: total / pows.length
				}
			})
		}
	},
	hashrateApi: (currencyName, apiUrl, request, type, unit, field) => {
		let mul = parseUnit(unit)

		let cur = Currencies.findOne({
			currencyName: currencyName
		})

		if (cur) {
			const Future = require('fibers/future')
			const fut = new Future()

			HTTP.call(request, apiUrl, (err, data) => {
				if (!err) {
					if (type.toLowerCase() === 'xml') {
						parseString(data.content, (err, data) => {
							if (!err) {
								fut.return(data)
							} else {
								throw new Meteor.Error('Error.', 'Error while parsing XML.')
							}
						})
					} else {
						fut.return(JSON.parse(data.content))
					}
				} else {
					throw new Meteor.Error('Error.', 'Error when requesting API data.')
				}
			})

			let data = fut.wait() // let's wait for our data

			let reg = /^[\w$]([\w.](\[\d+\])?)+$/
			let value = 0

			const get = require('lodash.get') // better solution than eval()

			if (reg.test(field)) {
				value = get(data, field)
			} else {
				throw new Meteor.Error('Error.', 'Error while parsing field value.')
			}

			let algo = HashAlgorithm.findOne({
				name: new RegExp(cur.hashAlgorithm, 'i')
			})

			if (algo) {
				let avg = HashAverage.findOne({
					algorithm: algo._id
				})

				let f = parseInt(value) * mul * (avg.average)

				console.log(`hashpower: ${f}`)
				
				Currencies.update({
					_id: cur._id
				}, {
					$set: {
						hashpower: f
					}
				})
			} else {
				throw new Meteor.Error('Error.', 'Unknown algorithm.')
			}
		} else {
			throw new Meteor.Error('Error.', 'Unknown currency name.')
		}
	}
})
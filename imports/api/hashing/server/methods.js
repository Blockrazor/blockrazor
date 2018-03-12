import { Meteor } from 'meteor/meteor'

import { HashAlgorithm, HashAverage, HashHardware, HashPower, HashPowerImages, HashUnits, UserData, Currencies, Bounties, REWARDCOEFFICIENT } from '/imports/api/indexDB.js'

import { parseString } from 'xml2js'
import { creditUserWith, removeUserCredit } from '/imports/api/utilities'

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
	addHashpower: (category, device, algo, hashrate, unit, power, image) => {
		const Future = require('fibers/future')
		const fut = {
			hw: new Future(), 
			algo: new Future(), 
			unit: new Future()
		}

		if (Meteor.userId()) {
			if (category && device && algo && hashrate && unit && power && image) {
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

				let n = HashPower.insert({
					hashCategory: category,
					device: fut.hw.wait(),
					hashAlgorithm: al,
					hashRate: hashrate,
					unit: fut.unit.wait(),
					powerConsumption: power,
					image: image,
					createdBy: Meteor.userId(),
					createdAt: new Date().getTime()
				})

				Meteor.call('calculateAverage', al, (err, data) => {})

				Meteor.call('getHashPowerReward', Meteor.userId(), n, (err, data) => {
					console.log(data)
					if (!err) {
						creditUserWith(data, Meteor.userId(), 'adding new hash power data') // credit the user for adding new hash power data, the same way we credit users when adding new currencies

						HashPower.update({
							_id: n
						}, {
							$set: {
								reward: data
							}
						}) // save the reward so we can deduce it from user's balance if data is questionable
					}
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
	flagHashpower: (id, reason) => {
		if (Meteor.userId()) {
			let hp = HashPower.findOne({
				_id: id
			})

			if (hp) {
				HashPower.update({
					_id: id
				}, {
					$push: {
						flags: {
							reason: reason,
							userId: Meteor.userId(),
							date: new Date().getTime()
						}
					}
				})
			} else {
				throw new Meteor.Error('Error.', 'Wrong id.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to log in first.')
		}
	},
	hashPowerVote: function(hpId, type) {
        if (!Meteor.userId()) {
        	throw new Meteor.Error('Error.', 'Please log in first')
        }

        let mod = UserData.findOne({
        	_id: this.userId
        }, {
        	fields: {
        		moderator: true
        	}
        })

        if (!mod || !mod.moderator) {
          	throw new Meteor.Error('Error.', 'mod-only')
        }
        
        let hp = HashPower.findOne({
        	_id: hpId
        })

        if (!(hp.votes || []).filter(i => i.userId === this.userId).length) { // user hasn't voted yet
        	HashPower.update({
        		_id: hp._id
        	}, {
        		$inc: {
        			score: type === 'voteUp' ? 1 : -1, // increase or decrease the current score
        			[type === 'voteUp' ? 'upvotes' : 'downvotes']: 1 // increase upvotes or downvotes
        		},
        		$push: {
        			votes: {
        				userId: this.userId,
        				type: type,
        				loggedIP: this.connection.clientAddress,
        				time: new Date().getTime()
        			}
        		}
        	})
        }
           
        let approveChange = HashPower.find({
        	_id: hp._id
        }, {
        	fields: {
        		score: 1,
        		upvotes: 1,
        		downvotes: 1 
        	} 
        }).fetch()[0]

        // remove the flag if the score is >= 3
        if (approveChange.score >= 3) {
            HashPower.update({
            	_id: hp._id
            }, {
            	$set: {
            		score: 0, // reset all vote related values
            		upvotes: 0,
            		downvotes: 0,
            		votes: [],
            		flags: [] // remove all flags from the hash power data if it receives enough upvotes
            	}
            })

            return 'ok'
        }

        // Delete the hash power data if it the score is <= -3
        if (approveChange.score <= -3) {
			if (hp) {
				HashPower.remove({
					_id: hp._id
				})

				removeUserCredit(hp.reward || 0, hp.createdBy, 'removing added hash power data.') // remove the reward
			} else {
				throw new Meteor.Error('Error.', 'Wrong id.')
			}
                
            return 'not-ok'
        }
    },
    deleteHashpower: id => {
		if (Meteor.userId()) {
			let hp = HashPower.findOne({
				_id: id
			})

			if (hp) {
				if (hp.createdBy === Meteor.userId()) { // you can only delete the hash power data if you've added it
					HashPower.remove({
						_id: id
					})

					removeUserCredit(hp.reward || 0, hp.createdBy, 'removing added hash power data.') // remove the reward
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
				_id: cur.hashAlgorithm
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
	},
	uploadHashPowerImage: (fileName, binaryData, md5) => {
    	let md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString()
      	if (md5validate !== md5) {
        	throw new Meteor.Error('Error.', 'Failed to validate md5 hash.')
        	return false
      	}
        if (!Meteor.userId()) {
          	throw new Meteor.Error('Error.', 'You must be logged in to do this.');
          	return false
        }

        const fs = require('fs')

        let mime = require('mime-types')
        let mimetype = mime.lookup(fileName)
        let validFile = _supportedFileTypes.includes(mimetype)
        let fileExtension = mime.extension(mimetype)
        let filename = `${_hashPowerUploadDirectory}${md5}.${fileExtension}`
        let filenameWatermark = `${_hashPowerUploadDirectory}${md5}_watermark.${fileExtension}`

        let insert = false

        if (!validFile) {
            throw new Meteor.Error('Error.', 'File type not supported, png, gif and jpeg supported');
            return false
        }

        try {
        	insert = HashPowerImages.insert({
            	_id: md5,
            	createdAt: new Date().getTime(),
            	createdBy: Meteor.userId(),
            	extension: fileExtension
          	})
        } catch(error) {
        	throw new Meteor.Error('Error.', 'That image has already been used on Blockrazor. You must take your own original screenshot of your mining rig.');
        }

        if (insert !== md5) {
        	throw new Meteor.Error('Error.', 'Something is wrong, please contact help.')
        }

        fs.writeFileSync(filename, binaryData, {
        	encoding: 'binary'
        }, Meteor.bindEnvironment((error) => {
            if (error) {
            	log.error('Error in uploadHashPowerImage', error)
            }
        }))

		//Add watermark to image
		if (gm.isAvailable) {
    		gm(filename).command('composite').gravity('SouthEast').out('-geometry', '+1+1').in(_watermarkLocation).write(filenameWatermark, Meteor.bindEnvironment((err, stdout, stderr, command) => {
    			if (!err) {
	                fs.unlinkSync(filename)

	                fs.rename(filenameWatermark, filename, (err) => {
	                    if (err) {
	                    	console.error(err)
	                    }
	                })
            	}
        	}))
	    } else {
	    	log.error('Required gm dependicies are not available', {})
	    }
	},
	// last added hash power data, used to determine bounty reward
	getLastHashPower: () => HashPower.find({}, {
    	sort: {
        	createdAt: -1
      	}
    }).fetch()[0],
    getHashPowerReward: (userId, hpId) => {
    	let bounty = Bounties.findOne({
        	userId: userId,
        	type: 'new-hashpower'
      	})

      	let lastHashPower = HashPower.find({}, {
        	sort: {
          		createdAt: -1
        	}
      	}).fetch()[0]

      	let hp = HashPower.findOne({
        	_id: hpId
      	}) || {}

      	if (bounty) {
        	Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {}) // delete the bounty, we're done with it

        	if (bounty.expiresAt < hpId.createdAt) {
          		console.log('already expired')
          		return ((Date.now() - lastHashPower.createdAt) / REWARDCOEFFICIENT) * 0.9
        	} else {
          		console.log('actual bounty')
          		return Number(bounty.currentReward)
        	}
      	} else {
        	console.log('no bounty')
        	return ((Date.now() - lastHashPower.createdAt) / REWARDCOEFFICIENT) * 0.9
      	}
    }
})
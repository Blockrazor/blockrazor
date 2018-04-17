import { Meteor } from 'meteor/meteor'
import { UserData, Wallet, Currencies, Bids, Auctions } from '/imports/api/indexDB'
import { check } from 'meteor/check'
import { segmentEvent } from '/imports/api/analytics.js';

const transfer = (to, from, message, amount, currency) => {
	UserData.upsert({
		_id: to
	}, {
		$inc: {
			[currency === 'KZR' ? 'balance' : `others.${currency}`]: amount
		}
	})

	Wallet.insert({
	   	time: new Date().getTime(),
	   	owner: to,
	   	type: 'transaction',
	  	from: from,
	  	message: message,
	   	amount: amount,
	  	read: false,
	   	currency: currency,
	   	rewardType: 'auctions'
	})
}

Meteor.methods({
	newAuction: (name, description, options) => {
		check(name, String)
		check(description, String)
		check(options, Object)

		if (Meteor.userId()) {
			let user = UserData.findOne({
				_id: Meteor.userId()
			})

			if (options.amount && user && (options.baseCurrency === 'KZR' ? user.balance : (user.others || {})[options.baseCurrency]) > options.amount && options.amount > 0) {
				if (options.timeout < new Date().getTime()) {
					throw new Meteor.Error('Error.', 'Auction can\'t end in the past.')
				}

				Auctions.insert({
				    name: name,
				    description: description,
				    options: options,
				    createdBy: Meteor.userId(),
				    createdAt: new Date().getTime(),
				    closed:false
				})

						//you must define an event and can define multiple properties if required
						let payload = {
						    event: 'Created an Auction',
						    properties: {
						        auction: name
						    }
						}
						//invoke segment function with the defined payload above
						segmentEvent(payload);

				// reserve the amount
				transfer(Meteor.userId(), 'Blockrazor', `${options.amount} ${options.baseCurrency} has been reserved from your account.`, -options.amount, options.baseCurrency)
			} else {
				throw new Meteor.Error('Error.', 'Insufficient funds.')
			}
		} else {
			throw new Meteor.Error('Error.', 'You have to be logged in.')
		}
	},
	checkAuctions: () => { // cron function, every minute
		Auctions.find({
			_id: {
				$ne: 'top-currency'
			}
		}).fetch().forEach(i => {
			Meteor.call('completeAuction', i._id, (err, data) => {})
		})
	},
	completeAuction: (auctionId) => {
		check(auctionId, String)

		let auction = Auctions.findOne({
			_id: auctionId
		})

		if (auction && !auction.closed) {
			if (new Date(auction.options.timeout).getTime() < new Date().getTime()) { // if it's done
				if (auction.options.highest > auction.options.reserve) {
					let winner = Bids.findOne({
						auctionId: auctionId,
						amount: auction.options.highest
					})

					let bids = Bids.find({
						auctionId: auctionId,
						amount: {
							$ne: auction.options.highest
						}
					}).fetch()

					bids.forEach(i => {
						Meteor.call('cancelBid', i._id, (err, data) => {}) // remove all other bids
					})

					if (winner) {
						// Transfer the funds
						transfer(winner.userId, 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been added to your account.`, auction.options.amount, auction.options.baseCurrency)
						
						transfer(winner.userId, auction.createdBy, `${winner.amount} ${auction.options.acceptedCurrency} has been removed from your account.`, -winner.amount, auction.options.acceptedCurrency)
					    
						transfer(auction.createdBy, winner.userId, `${winner.amount} ${auction.options.acceptedCurrency} has been added to your account.`, winner.amount, auction.options.acceptedCurrency)
					} else {
						transfer(auction.createdBy, 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been returned your account.`, auction.options.amount, auction.options.baseCurrency)
					}
				} else {
					transfer(auction.createdBy, 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been returned your account.`, auction.options.amount, auction.options.baseCurrency)
				}

				Auctions.update({
					_id: auctionId
				}, {
					$set: {
						closed: true
					}
				})
			} else {
				throw new Meteor.Error('Error.', 'Auction is still not over.')
			}
		} else {
			throw new Meteor.Error('Error.', 'Invalid auction.')
		}
	},
	cancelAuction: (auctionId) => {
		check(auctionId, String)

		let auction = Auctions.findOne({
			_id: auctionId
		})

		if (auction) {
			if (Meteor.userId() === auction.createdBy) {
				if (auction.closed) {
					throw new Meteor.Error('Error.', 'You can\'t cancel a closed auction')
				}

				let bids = Bids.find({
					auctionId: auctionId
				}).fetch()

				if (bids && bids.length > 0) {
					throw new Meteor.Error('Error.', 'You can\'t cancel an auction with active bids.')
				} else {				
					Auctions.remove({
						_id: auctionId
					})

					bids.forEach(i => {
						Meteor.call('cancelBid', i._id, (err, data) => {}) // remove all other bids
					})

					// release the amount
					transfer(Meteor.userId(), 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been returned your account.`, auction.options.amount, auction.options.baseCurrency)
				}
			} else {
				throw new Meteor.Error('Error.', 'Auction is not yours.')
			}
		} else {
			throw new Meteor.Error('Error.', 'Invalid auction.')
		}
	},
	placeBid: (auctionId, amount, options) => {
		check(auctionId, String)
		check(amount, Number)
		check(options, Object)

		if (Meteor.userId()) {
			let user = UserData.findOne({
				_id: Meteor.userId()
	      	})
	      	let acceptedCurrency = options.currency || 'KZR'  // for any auction
	      	let bidPaymentCurrency = options.type === 'currency' ? 'KZR' : options.currency  // if currency auction, payment currency is always 'KZR'. other auctions, payment currency is given currency

			if ((bidPaymentCurrency === 'KZR' ? user.balance : (user.others || {})[bidPaymentCurrency]) > amount && amount > 0) {
				let auction = Auctions.findOne({
					_id: auctionId
				})

        // for currency auction all currencies accepted (only the payment needs to perform via KZR)
				if (auction && (auction._id === 'top-currency') ||  ((auction.options && auction.options.acceptedCurrency || 'KZR') === acceptedCurrency)) {
					if (auction._id !== 'top-currency') { // top currency aggregates all bids, others need a highest bid
						if (auction.closed) {
							throw new Meteor.Error('Error.', 'You can\'t bid on a closed currency.')
						}

						if (auction.createdBy === Meteor.userId()) {
							throw new Meteor.Error('Error.', 'You can\'t bid on your own auction.')
						}

						if (amount <= auction.options.highest) {
							throw new Meteor.Error('Error.', 'Bid amount is not high enough.')
						} else {
							Auctions.update({
								_id: auction._id
							}, {
								$set: {
									'options.highest': amount
								}
							})
						}

						let last = Bids.findOne({
							userId: Meteor.userId(),
							auctionId: auction._id
						})

						if (last) {
							Meteor.call('cancelBid', last._id, (err, data) => {})
						}

						if (amount > auction.options.reserve) {
							Auctions.update({
								_id: auction._id
							}, {
								$set: {
									'options.reserveMet': true
								}
							})
						}
					}

					Bids.insert({
						auctionId: auctionId,
						userId: Meteor.userId(),
						options: options,
						amount: amount,
						date: new Date().getTime(),
						currency: bidPaymentCurrency
					})

					transfer(user._id, 'Blockrazor', `${bidPaymentCurrency} has been reserved from your account for bidding on an auction.`, -amount, bidPaymentCurrency)
				} else {
					throw new Meteor.Error('Error.', `Currency ${options.currency} is not valid.`)
				}
			} else {
				throw new Meteor.Error('Error.', 'Insufficient funds.')
			}
		} else {
			throw new Meteor.Error('Error.', 'Please log in first.')
		}
	},
	cancelBid: (bidId) => {
		check(bidId, String)

		if (Meteor.userId()) {
			let bid = Bids.findOne({
				_id: bidId,
				userId: Meteor.userId()
			})

			if (bid) {
				Bids.remove({
					_id: bid._id
				})

				bid.currency = bid.currency || 'KZR'

				transfer(Meteor.userId(), 'Blockrazor', `${bid.amount} ${bid.currency} has been returned to your account for cancelling a bid.`, bid.amount, bid.currency)
			} else {
				throw new Meteor.Error('Error.', 'Bid does not exist.')
			}
		} else {
			throw new Meteor.Error('Error.', 'Please log in first.')
		}
	},
	drainTopAuction: (auctionId, drainRate) => {
		check(auctionId, String)
		check(drainRate, Number)

		let auction = Auctions.findOne({
			_id: auctionId
		})

		if (auction) {
			if (auction._id === 'top-currency') {
				let bids = Bids.find({
					auctionId: auctionId
				}).fetch()

				if (bids.length) {
					let currencies = {}

					bids.forEach(i => {
						currencies[i.options.currency] = currencies[i.options.currency] ? currencies[i.options.currency] + i.amount : i.amount
					})

					let sorted = Object.keys(currencies).sort((i1, i2) => {
						return currencies[i2] - currencies[i1]
					}) // find the currently top currency

					let drainAmount = drainRate / bids.length // drain all bids equally

					Bids.update({
						auctionId: auctionId,
						options: {
							type: 'currency',
							currency: sorted[0]
						}
					}, {
						$inc: {
							amount: -drainAmount
						}
					}, {
						multi: true
					})

					Bids.find({
						auctionId: auctionId,
						options: {
							type: 'currency',
							currency: sorted[0]
						}
					}).fetch().forEach(i => {
						if (i.amount <= 0) {
							Bids.remove({
								_id: i._id
							})
						}
					}) // clear empty bids

					let last = Currencies.findOne({
						featured: true
					})

					if (!last || (last && last._id !== sorted[0])) {
						if (last) {
							Currencies.update({
								_id: last._id
							}, {
								$set: {
									featured: false
								}
							})
						}

						Currencies.update({
							_id: sorted[0]
						}, {
							$set: {
								featured: true
							}
						})
					} // set the the featured flag for the top currency for easy display
				} else { // if there are no bids, remove the featured status from the last feature currency to prevent it from staying on top
					Currencies.update({
						featured: true
					}, {
						$set: {
							featured: false
						}
					})
				}
			}
		} else {
			throw new Meteor.Error('Error.', 'Auction does not exist.')
		}
	}
})
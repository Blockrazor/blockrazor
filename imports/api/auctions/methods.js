import { Meteor } from 'meteor/meteor'
import { UserData, Wallet, Currencies, Bids, Auctions } from '/imports/api/indexDB'
import { check } from 'meteor/check'
import { segmentEvent } from '/imports/api/analytics.js'

const incr = 0.0001

export const transfer = (to, from, message, amount, currency) => {
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
					throw new Meteor.Error('Error.', 'messages.auctions.past')
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
						}
						//invoke segment function with the defined payload above
						segmentEvent(payload);

				// reserve the amount
				transfer(Meteor.userId(), 'Blockrazor', `${options.amount} ${options.baseCurrency} has been reserved from your account.`, -options.amount, options.baseCurrency)
			} else {
				throw new Meteor.Error('Error.', 'messages.auctions.insufficient_funds')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.login')
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
				if ((auction.options.highest > auction.options.reserve) || (auction.options.max > auction.options.reserve)) {
					if (auction.options.highest < auction.options.reserve) {
						auction.options.highest =  auction.options.reserve + 0.01 // ensure that the reserve is met if the max amount is bigger than the reserve value
					}

					let bids = auction.bids || []

					bids.forEach(i => {
						Meteor.call('cancelBid', auction._id, i.userId, (err, data) => {}) // remove all other bids
					})

					if (auction.options.highestBidder) {
						// Transfer the funds
						transfer(auction.options.highestBidder, 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been added to your account.`, auction.options.amount, auction.options.baseCurrency)
						
						transfer(auction.options.highestBidder, auction.createdBy, `${auction.options.highest} ${auction.options.acceptedCurrency} has been removed from your account.`, -auction.options.highest, auction.options.acceptedCurrency)
					    
						transfer(auction.createdBy, auction.options.highestBidder, `${auction.options.highest} ${auction.options.acceptedCurrency} has been added to your account.`, auction.options.highest, auction.options.acceptedCurrency)

						// save the current USD price for currency
						let currency

						if (auction.options.baseCurrency === 'KZR' && auction.options.acceptedCurrency !== 'USD') {
							currency = Currencies.findOne({
								currencySymbol: auction.options.acceptedCurrency
							})
						} else if (auction.options.baseCurrency !== 'KZR' && auction.options.baseCurrency !== 'USD') {
							currency = Currencies.findOne({
								currencySymbol: auction.options.baseCurrency
							})
						}

						if (currency && currency.price) {
							Auctions.update({
								_id: auctionId
							}, {
								$set: {
									currentPrice: currency.price
								}
							})
						}

						// set the KZR price to the last price
						let pricePerKZR

						if (auction.options.baseCurrency === 'KZR') {
							pricePerKZR = ((auction.options.highest || 0) / auction.options.amount)
						} else {
							pricePerKZR = (auction.options.highest || 0) !== 0 ? (auction.options.amount / (auction.options.highest || 0)) : 0
						}
						
						Currencies.update({
							currencySymbol: 'KZR'
						}, {
							$set: {
								price: (pricePerKZR * ((currency && currency.price) || 1)).toFixed(2)
							}
						})
					} else {
						transfer(auction.createdBy, 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been returned your account.`, auction.options.amount, auction.options.baseCurrency)
					}
				} else {
					let bids = auction.bids || []

					bids.forEach(i => {
						Meteor.call('cancelBid', auction._id, i.userId, (err, data) => {})
					})

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
				throw new Meteor.Error('Error.', 'messages.auctions.not_over')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.auctions.invalid_auction')
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
					throw new Meteor.Error('Error.', 'messages.auctions.cancel_closed')
				}

				let bids = auction.bids || []

				if (bids && bids.length > 0) {
					throw new Meteor.Error('Error.', 'messages.auctions.cancel_active')
				} else {				
					Auctions.remove({
						_id: auctionId
					})

					// release the amount
					transfer(Meteor.userId(), 'Blockrazor', `${auction.options.amount} ${auction.options.baseCurrency} has been returned your account.`, auction.options.amount, auction.options.baseCurrency)
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.auctions.not_your')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.auctions.invalid_auction')
		}
	},
	placeAutoBid: (auctionId, options) => {
		check(auctionId, String)
		check(options, Object)

		let auction = Auctions.findOne({
			_id: auctionId
		})

		if (auction && auction._id !== 'top-currency') {
			let lastBid = Bids.findOne({
				auctionId: auction._id
			}, {
				sort: {
					date: -1
				}
			})

			if ((lastBid.amount + incr) <= auction.options.max) { // place the bid in this case
				if (lastBid.userId !== auction.options.highestBidder) {
					Auctions.update({
						_id: auction._id
					}, {
						$set: {
							'options.highest': lastBid.amount + incr // top it up
						}
					})

					Bids.insert({
						auctionId: auction._id,
						userId: auction.options.highestBidder,
						options: options,
						amount: lastBid.amount + incr,
						date: new Date().getTime(),
						currency: options.currency
					})
				}
			}
		}
	},
	placeBid: (auctionId, amount, options) => {
		check(auctionId, String)
		check(amount, Number)
		check(options, Object)

		let userId = Meteor.userId()

		if (userId) {
			let user = UserData.findOne({
				_id: userId
	      	})
	      	let acceptedCurrency = options.currency || 'KZR'  // for any auction
	      	let bidPaymentCurrency = options.type === 'currency' ? 'KZR' : options.currency  // if currency auction, payment currency is always 'KZR'. other auctions, payment currency is given currency

			if ((bidPaymentCurrency === 'KZR' ? user.balance : (user.others || {})[bidPaymentCurrency]) > amount && amount > 0) {
				let auction = Auctions.findOne({
					_id: auctionId
				})

        		// for currency auction all currencies accepted (only the payment needs to perform via KZR)
				if (auction && (auction._id === 'top-currency') || ((auction.options && auction.options.acceptedCurrency || 'KZR') === acceptedCurrency)) {
					let curBid = amount

					if (auction._id !== 'top-currency') { // top currency aggregates all bids, others need a highest bid
						if (auction.closed) {
							throw new Meteor.Error('Error.', 'messages.auctions.bid_closed')
						}

						if (auction.createdBy === userId) {
							throw new Meteor.Error('Error.', 'messages.auctions.bid_own')
						}

						if (amount <= ((auction.bids || []).filter(i => i.userId === userId)[0] || {}).amount) {
							throw new Meteor.Error('Error.', 'messages.auctions.bid_smaller')
						}

						if (amount <= auction.options.highest) {
							throw new Meteor.Error('Error.', 'messages.auctions.bid_not_high')
						} else {
							auction.options.max = auction.options.max || 0

							if (userId === auction.options.highestBidder && amount > auction.options.max) { // update the max amount and that's all
								Auctions.update({
									_id: auction._id
								}, {
									$set: {
										'options.highestBidder': userId,
										'options.max': amount
									}
								})
							}

							if (amount >= (auction.options.max + incr)) {
								curBid = (auction.options.max || 0) + incr
							}

							if (amount >= auction.options.max) {
								Auctions.update({
									_id: auction._id
								}, {
									$set: {
										'options.highestBidder': userId,
										'options.max': amount
									}
								})
							}

							if (userId !== auction.options.highestBidder) { // don't increase your bid without a valid reason
								Auctions.update({
									_id: auction._id
								}, {
									$set: {
										'options.highest': curBid
									}
								})
							}
						}

						if (curBid > auction.options.reserve) {
							Auctions.update({
								_id: auction._id
							}, {
								$set: {
									'options.reserveMet': true
								}
							})
						}
					} else {
						let currency = Currencies.findOne({
							_id: options.currency
						})

						if (!currency) {
							throw new Meteor.Error('Error', 'messages.auctions.unknown_currency')
						}
					}

					if (userId !== (auction.options || {}).highestBidder) { // don't insert a new bid if the highest bidder remains
						Bids.insert({
							auctionId: auctionId,
							userId: userId,
							options: options,
							amount: curBid,
							date: new Date().getTime(),
							currency: bidPaymentCurrency
						})
					}

					let remAmount = amount

					if (auction._id !== 'top-currency') { // this data is only needed for regular auctions
						let bids = auction.bids || []

						if (!bids.some(i => {
							if (i.userId === userId) {
								remAmount = amount - i.amount

								i.amount = amount

								return true
							}

							return false
						})) {
							bids.push({
								userId: userId,
								amount: amount
							})
						}

						Auctions.update({
							_id: auction._id
						}, {
							$set: {
								bids: bids
							}
						})

						Meteor.call('placeAutoBid', auctionId, options, (err, data) => {})
					}

					transfer(user._id, 'Blockrazor', `${bidPaymentCurrency} has been reserved from your account for bidding on an auction.`, -remAmount, bidPaymentCurrency)
				} else {
					throw new Meteor.Error('Error.', `messages.auctions.unknown_currency`)
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.auctions.insufficient_funds')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.login')
		}
	},
	cancelBid: (auctionId, userId) => {
		check(auctionId, String)
		check(userId, String)

		if (userId) {
			let auction = Auctions.findOne({
				_id: auctionId
			})

			if (auction) {
				let bid = (auction.bids || []).filter(i => i.userId === userId)[0]

				if (bid) {
					bid.currency = auction.options.acceptedCurrency || 'KZR'

					transfer(userId, 'Blockrazor', `${bid.amount} ${bid.currency} has been returned to your account.`, bid.amount, bid.currency)
				} else {
					throw new Meteor.Error('Error.', 'messages.auctions.bid_doesnt_exist')
				}
			} else {
				throw new Meteor.Error('Error.', 'messages.auctions.auctin_doesnt_exist')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.login')
		}
	},
	cancelCurrencyBid: (bidId) => {
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
				throw new Meteor.Error('Error.', 'messages.auctions.bid_doesnt_exist')
			}
		} else {
			throw new Meteor.Error('Error.', 'messages.login')
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
			throw new Meteor.Error('Error.', 'messages.auctions.auction_doesnt_exist')
		}
	}
})
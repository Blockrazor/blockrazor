import { Meteor } from 'meteor/meteor'
import { Auctions } from '../auctions'
import { Bids } from '../bids'
import { UserData, Wallet, Currencies } from '../../indexDB'

import { check } from 'meteor/check'

Meteor.methods({
	placeBid: (auctionId, amount, options) => {
		check(auctionId, String)
		check(amount, Number)
		check(options, Object)

		if (Meteor.userId()) {
			let user = UserData.findOne({
				_id: Meteor.userId()
			})

			if (user.balance > amount && amount > 0) {
				Bids.insert({
					auctionId: auctionId,
					userId: Meteor.userId(),
					options: options,
					amount: amount,
					date: new Date().getTime()
				})

				UserData.upsert({
					_id: user._id
				}, {
					$inc: {
						balance: -amount
					}
				})

			    Wallet.insert({
			    	time: new Date().getTime(),
			    	owner: user._id,
			    	type: 'transaction',
			      	from: 'Blockrazor',
			      	message: `${amount} KZR has been reserved from your account for bidding on an auction.`,
			      	amount: -amount,
			     	read: false
			    })
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

				UserData.upsert({
					_id: Meteor.userId()
				}, {
					$inc: {
						balance: bid.amount
					}
				})

			    Wallet.insert({
			    	time: new Date().getTime(),
			    	owner: Meteor.userId(),
			    	type: 'transaction',
			      	from: 'Blockrazor',
			      	message: `${bid.amount} KZR has been return to your account for cancelling a bid.`,
			      	amount: bid.amount,
			     	read: false
			    })
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
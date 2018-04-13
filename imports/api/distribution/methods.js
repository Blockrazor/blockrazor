import { Meteor } from 'meteor/meteor'
import { Wallet } from '/imports/api/indexDB'
import { check } from 'meteor/check'

Meteor.methods({
	calculateEarnings: () => {
		let total = 0
		let current = 1
		let ind = 1

		while (current !== 0) {
			let wallets = Wallet.find({
				$and: [{
					rewardType: 'auctions',
					time: {
						$lt: new Date().getTime() - ((ind - 1) * 1000*60*60*24*30),
						$gt: new Date().getTime() - (ind++ * 1000*60*60*24*30) // monthly
					},
					$or: [{
						from: 'System'
					}, {
						from: 'Blockrazor'
					}],
					$or: [{
						currency: 'KZR'
					}, {
						currency: {
							$exists: false
						}
					}]
				}]
			}).fetch()

			current = -wallets.reduce((i1, i2) => i1 + (Number(i2.amount) || 0), 0)

			total += current
		}

		let earnings = ind > 2 ? (total / (ind - 2)) : 0

		return {
			'oneMonth': earnings.toFixed(2),
			'sixMonths': (earnings * 6).toFixed(2),
			'oneYear': (earnings * 12).toFixed(2)
		}
	},
	calculateSpendings: () => {
		let total = 0
		let current = 1
		let ind = 1

		while (current !== 0) {
			let wallets = Wallet.find({
				$and: [{
					$or: [{
						from: 'System'
					}, {
						from: 'Blockrazor'
					}],
					$or: [{
						rewardType: 'hashReward'
					}, {
						rewardType: 'anwserQuestion'
					}, {
						rewardType: 'problem'
					}, {
						rewardType: 'newCurrency'
					}, {
						rewardType: 'topCommentReward'
					}, {
						rewardType: 'bountyReward'
					}],
					$or: [{
						currency: 'KZR'
					}, {
						currency: {
							$exists: false
						}
					}],
					time: {
						$lt: new Date().getTime() - ((ind - 1) * 1000*60*60*24*30),
						$gt: new Date().getTime() - (ind++ * 1000*60*60*24*30) // monthly
					}
				}]
			}).fetch()

			current = wallets.reduce((i1, i2) => i1 + (Number(i2.amount) || 0), 0)

			total += current
		}

		let spendings = ind > 2 ? (total / (ind - 2)) : 0

		return {
			'oneMonth': spendings.toFixed(2),
			'sixMonths': (spendings * 6).toFixed(2),
			'oneYear': (spendings * 12).toFixed(2)
		}
	}
})
import { Meteor } from 'meteor/meteor'
import { UserData, Payments } from '/imports/api/indexDB'
import request from 'request'
import crypto from 'crypto'
import { transfer } from '/imports/api/auctions/methods'

const calculatePaymentId = (id, slug) => `${crypto.createHash('md5').update(id).digest('hex')}${crypto.createHash('md5').update(slug).digest('hex')}`

Meteor.methods({
	getNewPaymentsMonero: () => {
		let ids = UserData.find({}).fetch().map(i => {
			let paymentId

			if (i.paymentId) {
				paymentId = i.paymentId
			} else {
				let user = Meteor.users.findOne({
					_id: i._id
				}) || {}

				paymentId = calculatePaymentId(i._id, user.slug || '')

				UserData.update({
					_id: i._id
				}, {
					$set: {
						paymentId: paymentId
					}
				})
			}

			return {
				userId: i._id,
				paymentId: paymentId
			}
		})

		let height = (Payments.findOne({
			_id: 'monero'
		}) || {}).blockHeight || 0

		const Future = require('fibers/future')
		const fut = new Future()

		request.post({
			forever: true,
			url: `http://${_XMRRPC}/json_rpc`, // change to real RPC API url
            //auth: {
            //	user: 'qwerty',
            //	pass: '12345',
            //	sendImmediately: false
            //},
			json: {
				jsonrpc: '2.0',
				id: 0,
				method: 'getheight'
			}
		}, Meteor.bindEnvironment((err, res, data) => {
			if (data && data.result && data.result.height) {
				fut.return(data.result.height)
			} else {
				fut.return(0)
			}
		}))

		let newHeight = fut.wait()
		console.log(newHeight, height)
		if (newHeight > height) {
			request.post({
				forever: true,
				url: `http://${_XMRRPC}/json_rpc`, // change to real RPC API url
	            // auth: {
	            //	username: 'qwerty',
	            //	password: '12345',
	            //	sendImmediately: false
	            //},
				json: {
					jsonrpc: '2.0',
					id: 0,
					method: 'get_bulk_payments',
					params: {
						payment_ids: ids.map(i => i.paymentId),
						min_block_height: height
					}
				}
			}, Meteor.bindEnvironment((err, res, data) => {
				console.log(data)
				if (data && data.result && data.result.payments) {
					Payments.upsert({
						_id: 'monero'
					}, {
						$set: {
							blockHeight: newHeight
						}
					})
					data.result.payments.forEach(i => {
						if (i.address === _XMRAddress) { // check if the address is correct, just in case, change to real address when in production
							let user = ids.filter(j => j.paymentId === i.payment_id)

							if (user.length) {
								let payment = Payments.findOne({
									userId: user[0].userId,
									txHash: i.tx_hash
								})

								if (!payment) { // if the payment hasn't been processed yet
									Payments.insert({
										userId: user[0].userId,
										paymentId: i.payment_id,
										txHash: i.tx_hash,
										date: new Date().getTime(),
										amount: i.amount,
										currency: 'XMR',
										address: i.address
									}) // save all possible data

									let realAmount = i.amount / 1000000000000

									transfer(user[0].userId, 'System', `You have deposited ${realAmount} XMR`, realAmount, 'XMR')
								}
							}
						}
					})
				}
			}))
		}
	}
})
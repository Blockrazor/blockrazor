import { Meteor } from 'meteor/meteor'
import { Encryption } from '/imports/api/indexDB.js'

Meteor.publish('encryption', () => {
	return Encryption.find({
		finished: false
	}, {
		fields: {
			decryptionKey: 0
		}
	})
})
/*
Meteor.publish('encryptionWinner', (encryptionId) => {
	let enc = Encryption.findOne({
		_id: encryptionId
	})

	if (enc.winner && enc.winner === Meteor.userId()) {
		return Encryption.find({
			_id: encryptionId
		})
	}
})*/
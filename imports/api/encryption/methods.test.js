import { chai, assert } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { callWithPromise } from '/imports/api/utilities' // import helpful utils
import { Encryption, ActivityLog } from '/imports/api/indexDB.js'

import './methods'

Meteor.userId = () => 'test-user'
Meteor.users.findOne = () => ({
    username: 'test'
})

Meteor.user = ()=> ({
    username: 'test'
})

describe('Deadman trigger test', function() { 
	it('Deadman switch triggers the correct action', function() {
        Encryption.insert({
            decryptionKey: 'testKey'
        })

        Meteor.users.find = () => ({
            fetch: () => [{ username: 'test', _id: 'test-user' }]
        })

    	return callWithPromise('checkDeadmanTrigger').then(data => { // mocha likes promises
    		let enc = Encryption.findOne({})

            assert.ok(enc)

            assert.ok(!enc.finished)
            assert.ok(enc.canVote.length > 0)
            assert.ok(enc.votes.length === 0)
    	})
  	})

    it('Users can vote', function() {
        let enc = Encryption.findOne({
            finished: false
        })

        assert.ok(enc)

        return callWithPromise('deadmanTriggerVote', 'test').then(data => {
            let encN = Encryption.findOne({})

            assert.ok(encN)
            assert.ok(encN.votes.length > 0)
            assert.ok(encN.finished)
            assert.ok(encN.winner)

            assert.ok(ActivityLog.findOne({}).content.includes('testKey'))
        })
    })

    after(function() {
        Encryption.remove({})
        ActivityLog.remove({})
    })
})

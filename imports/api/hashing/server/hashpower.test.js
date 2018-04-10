import { chai, assert } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { callWithPromise } from '/imports/api/utilities' // import helpful utils
import { HashPower, HashAverage, HashAlgorithm, HashUnits, HashHardware } from '/imports/api/indexDB.js' // import HashPower database

import '/imports/api/hashing/methods' // import the required methods

Meteor.userId = () => 'test-user' // override the meteor userId, so we can test methods that require a user
Meteor.users.findOne = () => ({
    username: 'test'
}) // stub user data as well
Meteor.user = ()=> ({
    username: 'test'
})

describe('Hash power data', function() { // describes the feature we're testing
	it('Hash power data can be added', function() { // describes things that the feature should do
        let hashes = HashPower.find({}).fetch() // get all hashes so we can compare lengths later

    	return callWithPromise('addHashpower', 'ASIC', 'GTX 1080', 'test-algo', '1000', 'h/s', '1000', 'test').then(data => { // mocha likes promises
    		let hashesAfter = HashPower.find({}).fetch()

            assert.equal(hashes.length + 1, hashesAfter.length) // check if the data is inserted

    		let hash = HashPower.findOne({
                hashCategory: 'ASIC',
                hashRate: '1000',
                powerConsumption: '1000',
                image: 'test',
                createdBy: Meteor.userId()
            })

            assert.ok(hash) // check if everything is correct
            // assert.ok checks whether an object is truthy (defined)
            // assert.ok({}) => true
            // assert.ok(undefined) => false
    	})
  	})

    it('Hash power data can be flagged', function() {
        let hash = HashPower.findOne({}) // our hash power

        assert.ok(hash)

        return callWithPromise('flagHashpower', hash._id, 'test').then(data => {
            let hashAfter = HashPower.findOne({
                _id: hash._id
            })

            assert.ok(hashAfter.flags) // check if the array exists
            assert.isAbove(hashAfter.flags.length, 0) // check if the flag was added
            // assert.isAbove check whether the first argument is bigger than second
            // assert.isAbove(2, 0) => true
            assert.ok(hashAfter.flags.filter(i => i.reason === 'test')[0]) // check if the reason is ok
        })
    })

    it('Last hash power data can be fetched for bounties', function() {
        return callWithPromise('getLastHashPower').then(data => {
            assert.ok(data) // check if the returned hash power is defined
        })
    })

    it('Bounty reward for hash power data can be fetched', function() {
        let hash = HashPower.findOne({})

        assert.ok(hash)

        return callWithPromise('getHashPowerReward', Meteor.userId(), hash._id).then(data => {
            assert.isNumber(data) // bounty reward has to be numeric
            // assert.isNumber checks if the argument is a number
            // assert.isNumber(4) => true
            // assert.isNumber(0.232) => true
            // assert.isNumber("42") => false
        })
    })

    it('Hash power averages can be calculated for each algorithm', function() {
        return callWithPromise('updateAverages').then(data => {
            let averages = HashAverage.find({}).fetch()

            for (let i = 0; i < averages.length; i++) { // for loops are recommended in mocha, please avoid iterators such as forEach, as they could cause issues
                assert.isNumber(averages[i].average) // check if the data is numeric
            }
        })
    })

    it('Hash power data can be deleted', function() {
        let hash = HashPower.findOne({})
        let hashes = HashPower.find({}).fetch()

        assert.ok(hash)

        return callWithPromise('deleteHashpower', hash._id).then(data => {
            let hashesAfter = HashPower.find({}).fetch()
            let hashAfter = HashPower.findOne({
                _id: hash._id
            })

            assert.equal(hashes.length - 1, hashesAfter.length)
            assert.notOk(hashAfter) // check if the hash is deleted
        })
    })

    after(function() {
        // let's cleanup everything we've created during the test

        // after running the tests, it's generally a good idea to clean everything up
        // it may not be necessary in every case
        HashAlgorithm.remove({})

        HashAverage.remove({})

        HashHardware.remove({})

        HashUnits.remove({})
    })
})

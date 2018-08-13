import { chai, assert, expect } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { callWithPromise, LocalizableCollection } from '/imports/api/utilities' // import helpful utils
import { Mongo } from 'meteor/mongo'


let localCurrencies = new LocalizableCollection('currenciesTest', 'fetchCurrencies')


describe('Localizable collections', function() {
	it('Always calls super while running on the server', function() {
        let id = localCurrencies.insert({
            currencyName: `Test`,
            currencySymbol: `TST`,
            createdAt: new Date().getTime(),
            owner: 'randId'
        })

        assert.equal(localCurrencies.findOne({
            _id: id
        }).currencyName, 'Test');
        
        expect(localCurrencies.find({}).fetch().length).to.be.at.least(1);
  	})
})
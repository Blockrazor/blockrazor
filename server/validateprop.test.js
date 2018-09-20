import { chai, assert } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { callWithPromise } from '/imports/api/utilities'

var test_walletUpoadDirectory = '/home/gareth/blockrazor_assets/static/images/wallets/';
var test_walletUpoadDirectoryPublic = '/images/wallets/';
var test_coinUpoadDirectory = '/home/gareth/blockrazor_assets/static/images/coin/';
var test_coinUpoadDirectoryPublic = '/images/coin/';
var test_hashPowerUploadDirectory = '/home/gareth/blockrazor_assets/static/images/hashpower/'
var test_hashPowerUploadDirectoryPublic = '/images/hashpower/'
var test_profilePictureUploadDirectory = '/home/gareth/blockrazor_assets/static/images/profile/'
var test_profilePictureUploadDirectoryPublic = '/images/profile/'
var test_watermarkLocation = '/home/gareth/blockrazor_assets/static/images/watermark.png'


var fs = require('fs');
var propertiesFile = process.env.PWD + '/lib/properties.js';

var d = fs.readFileSync(propertiesFile).toString();

describe('Validate properties.js', function() {

    it('_walletUpoadDirectory valid', function() {
        assert.ok(d.includes(test_walletUpoadDirectory))
    })
    it('_walletUpoadDirectoryPublic valid', function() {
        assert.ok(d.includes(test_walletUpoadDirectoryPublic))
    })
    it('_coinUpoadDirectory  valid', function() {
        assert.ok(d.includes(test_coinUpoadDirectory ))
    })
    it('_coinUpoadDirectoryPublic valid', function() {
        assert.ok(d.includes(test_coinUpoadDirectoryPublic))
    })
    it('_hashPowerUploadDirectory valid', function() {
        assert.ok(d.includes(test_hashPowerUploadDirectory))
    })
    it('_hashPowerUploadDirectoryPublic valid', function() {
        assert.ok(d.includes(test_hashPowerUploadDirectoryPublic))
    })
    it('_profilePictureUploadDirectory valid', function() {
        assert.ok(d.includes(test_profilePictureUploadDirectory))
    })
    it('_profilePictureUploadDirectoryPublic valid', function() {
        assert.ok(d.includes(test_profilePictureUploadDirectoryPublic))
    })
    it('_watermarkLocation valid', function() {
        assert.ok(d.includes(test_watermarkLocation))
    })


});
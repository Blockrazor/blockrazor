import { chai, assert } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { callWithPromise } from '../utils'

var test_walletUpoadDirectory = '/var/www/static/images/wallets/';
var test_walletUpoadDirectoryPublic = '/static/images/wallets/';
var test_coinUpoadDirectory = '/var/www/static/images/coin/';
var test_coinUpoadDirectoryPublic = '/static/images/coin/';
var test_hashPowerUploadDirectory = '/var/www/static/images/hashpower/'
var test_hashPowerUploadDirectoryPublic = '/static/images/hashpower/'
var test_profilePictureUploadDirectory = '/var/www/static/images/profile/'
var test_profilePictureUploadDirectoryPublic = '/static/images/profile/'
var test_watermarkLocation = '/Users/hellofriend/Documents/upload/watermark.png'


var fs = require('fs');
var propertiesFile = process.env.PWD + '/lib/properties.js';

describe('Test on I/O', function() {

    it('_walletUpoadDirectory valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_walletUpoadDirectory))
    })
    it('_walletUpoadDirectoryPublic valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_walletUpoadDirectoryPublic))
    })
    it('_coinUpoadDirectory  valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_coinUpoadDirectory ))
    })
    it('_coinUpoadDirectoryPublic valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_coinUpoadDirectoryPublic))
    })
    it('_hashPowerUploadDirectory valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_hashPowerUploadDirectory))
    })
    it('_hashPowerUploadDirectoryPublic valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_hashPowerUploadDirectoryPublic))
    })
    it('_profilePictureUploadDirectory valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_profilePictureUploadDirectory))
    })
    it('_profilePictureUploadDirectoryPublic valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_profilePictureUploadDirectoryPublic))
    })
    it('_watermarkLocation valid', function() {
        var d = fs.readFileSync(propertiesFile).toString();
        assert.ok(d.includes(test_watermarkLocation))
    })


});
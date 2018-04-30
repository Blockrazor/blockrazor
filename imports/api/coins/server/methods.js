import {
  Meteor
} from 'meteor/meteor';
import {
  ActivityLog, Bounties, REWARDCOEFFICIENT, UserData,
Currencies, PendingCurrencies, RejectedCurrencies, ChangedCurrencies,
HashAlgorithm, developmentValidationEnabledFalse
} from '/imports/api/indexDB.js';
import { rewardCurrencyCreator } from '/imports/api/utilities.js';
import { quality } from '/imports/api/utilities'
import { log } from '/imports/api/utilities'
Meteor.methods({
    'uploadCoinImage': function (fileName, imageOf, currencyId, binaryData,md5) {
      var error = function(error) {throw new Meteor.Error('error', error);}

        if (!this.userId) {
          throw new Meteor.Error('error', 'You must be logged in to do this.');
          return false;
        }

        var md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString();
        if(md5validate != md5) {
          throw new Meteor.Error('connection error', 'failed to validate md5 hash');
          return false;
        }

        var fs = Npm.require('fs');
        //get mimetpe of uploaded file
        var mime = require('/imports/api/miscellaneous/mime').default
        var mimetype = mime.lookup(fileName);
        var validFile = _supportedFileTypes.includes(mimetype);
        var fileExtension = mime.extension(mimetype);
        var filename_thumbnail = (_coinUpoadDirectory + md5 + '_thumbnail.' + fileExtension);
        var filename = (_coinUpoadDirectory + md5 + '.' + fileExtension);

        var insert = false;

        if (!validFile) {
            throw new Meteor.Error('Error', 'File type not supported, png, gif and jpeg supported');
            return false;
        }

        fs.writeFileSync(filename, binaryData, { encoding: 'binary' }, Meteor.bindEnvironment(function(error) {
            if (error) {
                log.error('Error in uploadWalletImage', error)
            };
        }))

        //create thumbnail for coin
        if (gm.isAvailable) {

            //create thumbnail
            var size = { width: 100, height: 100 };
            gm(filename)
                .resize(size.width, size.height + ">")
                .gravity('Center')
                .write(filename_thumbnail, function(error) {
                    if (error) console.log('Error - ', error);
                });
        }

      },
      'changeCoinImage': function (fileName, imageOf, currencyId, binaryData, md5) {
        var error = function (error) {
            throw new Meteor.Error('error', error);
        }

        if (!this.userId) {
            throw new Meteor.Error('error', 'You must be logged in to do this.');
            return false;
        }

        var md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString();
        if (md5validate != md5) {
            throw new Meteor.Error('connection error', 'failed to validate md5 hash');
            return false;
        }

        var fs = Npm.require('fs');
        //get mimetpe of uploaded file
        var mime = Npm.require('mime-types');
        var mimetype = mime.lookup(fileName);
        var validFile = _supportedFileTypes.includes(mimetype);
        var fileExtension = mime.extension(mimetype);
        var filename = (_coinUpoadDirectory + md5 + '.' + fileExtension);
        var filename_thumbnail = (_coinUpoadDirectory + md5 + '_thumbnail.' + fileExtension);


        var insert = false;

        if (!validFile) {
            throw new Meteor.Error('Error', 'File type not supported, png, gif and jpeg supported');
            return false;
        }

        fs.writeFileSync(filename, binaryData, {
            encoding: 'binary'
        }, Meteor.bindEnvironment(function (error) {
            if (error) {
                log.error('Error in file upload in uploadCoinImage', error)
            };
        }));

        //create thumbnail
        var size = {
            width: 200,
            height: 200
        };
        gm(filename)
            .resize(size.width, size.height + ">")
            .gravity('Center')
            .write(filename_thumbnail, function (error) {
                if (error) console.log('Error - ', error);
            });

    },
  })
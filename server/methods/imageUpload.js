import { Meteor } from 'meteor/meteor';
import { WalletImages } from '../../lib/database/Images.js';
import { Currencies } from '../../lib/database/Currencies.js';

Meteor.methods({
    'uploadWalletImage': function (fileName, imageOf, currencyId, binaryData, md5) {
      var error = function(error) {throw new Meteor.Error('error', error);}
      var md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString();
      if(md5validate != md5) {
        throw new Meteor.Error('connection error', 'failed to validate md5 hash');
        return false;
      }
        if (!this.userId) {
          console.log("NOT LOGGED IN");
          throw new Meteor.Error('error', 'You must be logged in to do this.');
          return false;
        }
        var fs = Npm.require('fs');
        var filename = ('/Users/gareth/git/blockrazor/temp/static/images/wallets/' + md5 + '.' + 'jpg');
        var insert = false;
        //var currency = Currencies.findOne({_id:currencyId}).currencyName;
        if(!Currencies.findOne({_id:currencyId}).currencyName){
          throw new Meteor.Error('error', 'error 135');
        }
        try {
          insert = WalletImages.insert({
            _id: md5,
            'currencyId':currencyId,
            'currencyName': Currencies.findOne({_id:currencyId}).currencyName,
            'imageOf': imageOf,
            'createdAt': new Date().getTime(),
            'createdBy': Meteor.user()._id
          });
        } catch(error) {
          throw new Meteor.Error('Error', 'That image has already been used on Blockrazor. You must take your own original screenshot.');
        }
        if(insert != md5) {throw new Meteor.Error('Error', 'Something is wrong, please contact help.');}

        fs.writeFile(filename, binaryData, {encoding: 'binary'}, function(error){
            if(error){console.log(error)};
        });
      }
});

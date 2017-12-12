import { Meteor } from 'meteor/meteor';
import { WalletImages } from '../../lib/database/Images.js';

Meteor.methods({
    'uploadWalletImage': function (fileName, imageOf, currencyId, binaryData, md5) {
      console.log(imageOf);
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
        fs.writeFile(filename, binaryData, {encoding: 'binary'}, function(error, result){
          console.log(error);
          console.log(result);
        });
    }
});

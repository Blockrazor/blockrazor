import { Meteor } from 'meteor/meteor';
var valid = false;

Meteor.methods({
    'uploadImage': function (fileName, binaryData, md5) {
      console.log(fileName);
      console.log(md5);
        if (!this.userId) {
          console.log("NOT LOGGED IN");
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

import { Meteor } from 'meteor/meteor';
import { WalletImages } from '../../lib/database/Images.js';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';
import { RatingsTemplates } from '../../lib/database/Ratings.js';

Meteor.methods({
  'addRatingQuestion': function(question, catagory) {
    if(!Meteor.user()._id){throw new Meteor.Error('error', 'please log in')};
    var id = parseInt("0x" + CryptoJS.MD5(question).toString().slice(0,10), 16);
    var id = id.toString();
    console.log(id);
    RatingsTemplates.insert({
      _id: id,
      'question': question,
      'catagory': catagory,
      'createdBy': Meteor.user()._id,
      'createdAt': new Date().getTime()
    });
  },
  'populateRatings': function() {
    var images = WalletImages.find({createdBy: Meteor.user()._id}).fetch();
    var currencies = [];
    for (i in images) {
      currencies.push(images[i].currencyId);
    }
    var currencies = _.uniq(currencies);
    console.log(currencies);
    var userInt = parseInt("0x" + CryptoJS.MD5(Meteor.user()._id).toString().slice(0,10), 16);

//Cycle through all possible combinations of currencies that this user has a wallet for
    for (i = 0; i < currencies.length - 1; i++) {
      for (j = i + 1; j < currencies.length; j++) {
        //we don't want to generate duplicate currency pairs for the user, the fastest way to make sure
        //is to combine the currency pairs and user ID into a number so that no matter what way
        //you combine this the result will be the same, new additions can then be compared immediately
       //and be verified unique for this user.
        var dec_i = parseInt("0x" + CryptoJS.MD5(currencies[i]).toString().slice(0,10), 16);
        var dec_j = parseInt("0x" + CryptoJS.MD5(currencies[j]).toString().slice(0,10), 16);
        //collect data for insert
        var _id = dec_i + dec_j + userInt; //add truncated MD5 of currencyId's and userId to prevent duplicates


        try{
          Ratings.insert({
            _id: _id,
            'owner': Meteor.user()._id,
            'currency0': currencies[i],
            'currency1': currencies[j],
            'winner': null,
            'createdAt': new Date().getTime(),
            'processedAd': null,
            'processed': false,
            //'catagory':
            // 'type':
            // 'questionText':
            // 'answeredAt':
            // 'Answered':
          })
        } catch(error) {
          console.log(error);
        }
        //console.log(currencies[i] + " + " + currencies[j]);
      }
    }
  },
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
        var filename = ('/Users/gareth/git/blockrazor/temp/static/images/wallets/' + md5 + '.' + 'jpg'); //FIXME
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
            'createdBy': Meteor.user()._id,
            'flags': 0,
            'approved': false
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

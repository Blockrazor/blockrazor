import { Meteor } from 'meteor/meteor';
import { WalletImages } from '../../lib/database/Images.js';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';
import { RatingsTemplates } from '../../lib/database/Ratings.js'
import { log } from '../main'

Meteor.methods({
  'flagWalletImage': function(imageId) {
    if(!this.userId){throw new Meteor.Error('error', 'please log in')};
    WalletImages.update(imageId, {
      $addToSet: {flaglikers: Meteor.userId()},
      $inc: {flags: 1}
    });
  },
  'approveWalletImage': function(imageId) {
    if(!this.userId){throw new Meteor.Error('error', 'please log in')};
    if(WalletImages.findOne({_id: imageId}).createdBy == this.userId) {
      throw new Meteor.Error('error', "You can't approve your own item.")
    };
    WalletImages.update(imageId, {
      $set: {approved: true, approvedBy: this.userId},
      $inc: {likes: 1}
    });
  },
  'answerRating': function(ratingId, winner) {
    if (Ratings.findOne({_id:ratingId}).owner == this.userId) {
      var loser = Ratings.findOne({_id:ratingId}).currency0Id;
      if(loser == winner) {
        loser = Ratings.findOne({_id:ratingId}).currency1Id;
      }
      if(winner == "tie") {
        loser = "tie";
      }

      Ratings.upsert({_id:ratingId}, {
        $set: {
          answered: true,
          winner: winner,
          loser: loser,
          answeredAt: new Date().getTime()
        }}
      )
    }
  },
  'addRatingQuestion': function(question, catagory, negative) {
    if(!this.userId){throw new Meteor.Error('error', 'please log in')};
    var id = parseInt("0x" + CryptoJS.MD5(question).toString().slice(0,10), 16);
    var id = id.toString();
    RatingsTemplates.insert({
      _id: id,
      'question': question,
      'catagory': catagory,
      'createdBy': this.userId,
      'createdAt': new Date().getTime(),
      'negative': !!negative
    });
  },
  //this will populate the ratings database for this user with any new Currencies
  //they have added, or if an admin has added new questions for their existing currencies.
  'populateRatings': function() {
    //fetch all the currencies this user uses:
    var images = WalletImages.find({createdBy: this.userId}).fetch();
    var currencies = [];
    for (i in images) {
      currencies.push(images[i].currencyId);
    }
    var currencies = _.uniq(currencies);

    //fetch the questions that will be asked of the user
    var ratingTemplates = RatingsTemplates.find({catagory: 'wallet'}).fetch();
    var userInt = parseInt("0x" + CryptoJS.MD5(this.userId).toString().slice(0,10), 16);

//Cycle through all possible combinations of currencies that this user has a wallet for
    for (i = 0; i < currencies.length - 1; i++) {
      for (j = i + 1; j < currencies.length; j++) {
        //we don't want to generate duplicate currency pairs for the user, the fastest way to make sure
        //is to combine the currency pairs and user ID into a number so that no matter what way
        //you combine this the result will be the same, new additions can then be compared immediately
       //and be verified unique for this user.
        var dec_i = parseInt("0x" + CryptoJS.MD5(currencies[i]).toString().slice(0,10), 16);
        var dec_j = parseInt("0x" + CryptoJS.MD5(currencies[j]).toString().slice(0,10), 16);
        //add truncated MD5 of currencyId's and userId to prevent duplicates
        var _id = dec_i + dec_j + userInt;
        //add question truncated MD5 Int to the _id
        for (k in ratingTemplates) {
          console.log(currencies[i] + " " + currencies[j] + " " + ratingTemplates[k]._id)
          id = (_id + parseInt(ratingTemplates[k]._id, 10)).toString();
          console.log(id);
          try{
            Ratings.insert({
              _id: id,
              'owner': this.userId,
              'currency0Id': currencies[i],
              'currency1Id': currencies[j],
              'winner': null,
              'loser': null,
              'currency0approved': false,
              'currency1approved': false,
              'questionId': ratingTemplates[k]._id,
              'questionText': ratingTemplates[k].question,
              'createdAt': new Date().getTime(),
              'processedAt': null,
              'processed': false,
              'catagory': ratingTemplates[k].catagory,
              'type': "wallet",
              'answeredAt': null,
              'answered': false
            })
          } catch(error) {
            log.error(`the combination of ${currencies[i]} and ${currencies[j]} exists in populateRatings!`, error)
          }
        }
        //create new Ratings item for each question and each currency pair for this userId



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

        //get mimetpe of uploaded file
        var mime = Npm.require('mime-types');
        var mimetype = mime.lookup(fileName);
        var validFile = _supportedFileTypes.includes(mimetype);
        var fileExtension = mime.extension(mimetype);
        var filename = (_walletUpoadDirectory + md5 + '.' + fileExtension); 
        var filenameWatermark = (_walletUpoadDirectory + md5 + '_watermark.' + fileExtension); 


        var insert = false;

        if (!validFile) {
            throw new Meteor.Error('Error', 'File type not supported, png, gif and jpeg supported');
            return false;
        }

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
            'createdBy': this.userId,
            'flags': 0,
            'likes': 0,
            'extension': fileExtension,
            'flaglikers': [],
            'approved': false
          });
        } catch(error) {
          throw new Meteor.Error('Error', 'That image has already been used on Blockrazor. You must take your own original screenshot of the wallet.');
        }
        if(insert != md5) {throw new Meteor.Error('Error', 'Something is wrong, please contact help.');}

        fs.writeFileSync(filename, binaryData, {encoding: 'binary'}, function(error){
            if(error){
              log.error('Error in uploadWalletImage', error)
            };
        });

//Add watermark to image
if(gm.isAvailable){
    gm(filename)
        .resize(2048, null)
        .command('composite')
        .gravity('SouthEast')
        .out('-geometry', '+1+1')
        .in(_watermarkLocation)
        .write(filenameWatermark, function(err, stdout, stderr, command){
            if (err){
                log.error("Error applying watermark", err)
            }
        });

    }else{
      log.error('required gm dependicies are not available', {})
    }
  }
});

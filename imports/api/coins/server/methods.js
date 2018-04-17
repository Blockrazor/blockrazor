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
        var mime = Npm.require('mime-types');
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
    'addCoin': function(data) {
      const Future = require('fibers/future')
      const fut = new Future()
  
      ////server-only validation, no optimistic UI #681 //is used by client, but is server only #682
    //Check that user is logged in
    if (!Meteor.userId()) {throw new Meteor.Error("Please log in first")};
    Meteor.call('isCurrencyNameUnique', data.currencyName);
  
     //Initialize arrays to store which data.<item>s pass or fail validation
      var allowed = [];
      var error = [];
  
      //Function to validate data (checkSanity)
      var checkSanity = function (value, name, type, minAllowed, maxAllowed, nullAllowed) {
        if (!developmentValidationEnabledFalse) return true
        if (type == "object") {
          if (typeof value == type && _.size(value) >= minAllowed && _.size(value) <= maxAllowed) {
            allowed.push(name);
            return true;
          } else { error.push(name); return false; }
        }
        if (typeof value == type && value.toString().length >= minAllowed && value.toString().length <= maxAllowed) {
          allowed.push(name);
          return true;
        } else if (!value && nullAllowed) {
          allowed.push(name);
          return true;
        } else {
          error.push(name);
          return false;
        }
      } //END checkSanity
  
  
  
      //Get coin status and type for dependent validation
      var altcoin = false;
      var proposal = false;
      var btcfork = false;
      var ico = false;
  
      for (i in data.launchTags) {
        if (data.launchTags[i].tag == "Altcoin") {
          altcoin = true;
        } if (data.launchTags[i].tag == "proposal") {
          proposal = true;
        } if (data.launchTags[i].tag == "Bitcoin Fork") {
          btcfork = true;
        } if (data.launchTags[i].tag == "ICO") {
          ico = true;
        }
      }
  
      //compulsory checks
      checkSanity(data.launchTags, "launchTags", "object", 1, 3);
      checkSanity(data.currencyName, "currencyName", "string", 3, 20);
      checkSanity(data.currencySymbol, "currencySymbol", "string", 2, 5);
      checkSanity(data.premine, "premine", "number", 1, 15);
      checkSanity(data.maxCoins, "maxCoins", "number", 4, 18);
      checkSanity(data.gitRepo, "gitRepo", "string", 18, 300);
      checkSanity(data.officialSite, "officialSite", "string", 6, 200);
      checkSanity(data.currencyLogoFilename, "currencyLogoFilename", "string", 1, 300);
  
      //Check the self-populating dropdowns
      if (!developmentValidationEnabledFalse || data.consensusSecurity != "--Select One--") {
        checkSanity(data.consensusSecurity, "consensusSecurity", "string", 6, 20);
        } else {error.push("consensusSecurity")};
  
      if (data.hashAlgorithm) { if (developmentValidationEnabledFalse && data.hashAlgorithm == "--Select One--") {
        error.push("hashAlgorithm")} else {
        checkSanity(data.hashAlgorithm, "hashAlgorithm", "string", 3, 40, true);
      }};
  
      //Check things that are always optional
      checkSanity(data.reddit, "reddit", "string", 12, 300, true);
      checkSanity(data.blockExplorer, "blockExplorer", "string", 6, 300, true);
      checkSanity(data.approvalNotes, "approvalNotes", "string", 0, 1000, true);
  
      //If this is a normal altcoin that already exists:
      if (altcoin && !proposal) {
        checkSanity(data.previousNames, "previousNames", "object", 0, 5);
        checkSanity(data.genesisTimestamp, "genesisTimestamp", "number", 13, 16);
        if (data.genesisTimestamp != 0) { if (isNaN(parseFloat(data.genesisTimestamp)) || data.genesisTimestamp < 1231006505000) {
          error.push("genesisTimestamp");
          allowed = allowed.filter(function(i) {return i != "genesisTimestamp"})
        }}
      }
  //If the coin exists, no matter what it is
      if (altcoin && proposal) {
        checkSanity(data.genesisTimestamp, "intendedLaunch", "number", 13, 16);
        if (data.genesisTimestamp < 1509032068000) {
          if (error.indexOf("genesisTimestamp") === -1) {
            error.push("genesisTimestamp");
          }
          allowed = allowed.filter(function(i) {return i != "genesisTimestamp"})
        }
      }
  
  //If this is an ICO (launched or not)
      if (ico) {
        checkSanity(data.ICOcoinsProduced, "ICOcoinsProduced", "number", 1, 15);
        checkSanity(data.ICOfundsRaised, "ICOfundsRaised", "number", 1, 15);
        checkSanity(data.icocurrency, "icocurrency", "string", 3, 3);
        if (data.premine < data.ICOcoinsProduced) {
          error.push("premine");
          allowed = allowed.filter(function(i) {return i != "premine"})
        };
      }
  
      //If this is an ICO that hasnt launched yet
      if (ico && proposal) {
        checkSanity(data.ICOcoinsIntended, "ICOcoinsIntended", "number", 1, 15);
        checkSanity(data.ICOnextRound, "ICOnextRound", "number", 13, 16);
        checkSanity(data.icoDateEnd, "icoDateEnd", "number", 13, 16);
        if (data.premine < data.ICOcoinsProduced + data.ICOcoinsIntended) {
          if (error.indexOf("premine") === -1) {
            error.push("premine");
          }
          allowed = allowed.filter(function(i) {return i != "premine"})
        };
      }
      //If this is a bitcoin fork (planned or existing)
      if (btcfork) {
        checkSanity(data.forkParent, "forkParent", "string", 6, 20, false);
        checkSanity(data.forkHeight, "forkHeight", "number", 6, 6, false);
        checkSanity(data.replayProtection, "replayProtection", "string", 4, 5, false)
      }
      //If this is not proposal
      if (!proposal) {
        checkSanity(data.exchanges, "exchanges", "object", 0, 15);
        checkSanity(data.blockTime, "blockTime", "number", 1, 4);
        checkSanity(data.confirmations, "confirmations", "number", 1, 4);
  
      }
  
      if (data.questions && data.questions.length) {
        allowed.push('questions')
  
        console.log(data.questions)
  
        let rankings = {}
        data.questions.forEach(i => {
          let val = i.negative ? -2 : 2 // if the questions is in negative context
          val = i.value === 'true' ? val : -val // if the answer is true, keep the sign, else negate the value
          rankings[i.category] = rankings[i.category] ? (rankings[i.category] + val) : (400 + val) // 400 is the base value
        })
  
        console.log(rankings)
  
        Object.keys(rankings).forEach(i => {
          data[`${i}Ranking`] = rankings[i]
  
          allowed.push(`${i}Ranking`)
        })
      }
  
  
      //Check that no one is playing silly buggers trying to put extra malicious crap into the data
      //for (item in data) {
      console.log("data: " + _.size(data));
      console.log(data);
  
        console.log("allowed: " + _.size(allowed));
        console.log(allowed);
  
        console.log("errors: " + _.size(error));
        console.log(error);
  
        console.log("unprocessed inputs: ", _.size(data) - (_.size(allowed) + _.size(error)));
        console.log("-----------------");
        //if(allowed.includes(data[item].)
    //  }
  
  
    if (error.length != 0) {throw new Meteor.Error(error)} 
    //skips data==allowed in development, adjust in config startup
    if(!developmentValidationEnabledFalse || error.length == 0 && _.size(data) == _.size(allowed)){
          //so long as validation is enabled in dev environment
          if (developmentValidationEnabledFalse){
            //add the algorithm if it doesn't exist, 
            if (!HashAlgorithm.findOne({
              _id: data.hashAlgorithm
            })) {
              Meteor.call('addAlgo', data.hashAlgorithm, data.consensusSecurity.toLowerCase().split(' ').reduce((i1, i2) => i1 + i2[0], ''), (err, data) => { // 'Proof of Work' -> 'pow'
                if (!err) {
                  fut.return(data)
                } else {
                  throw new Meteor.Error('Error.', err.reason)
                }
              })
            } else {
              fut.return(data.hashAlgorithm)
            }
    
            data.hashAlgorithm = fut.wait()
          }
      
      console.log("----inserting------");
      var insert = _.extend(data, {
        createdAt: new Date().getTime(),
        owner: Meteor.userId(),
        proposal: proposal,
        altcon: altcoin,
        ico: ico,
        btcfork: btcfork,
        bountiesCreated: false
      })
      PendingCurrencies.insert(insert, function(error, result){
      if (!result) {
      console.log(error);
      //return error;
      throw new Meteor.Error('Invalid', error);
      } else {
        //console.log(error);
        console.log(result)
        return "OK";
      }
      });
    } else {console.log("did not run insert function")}
    },
  })
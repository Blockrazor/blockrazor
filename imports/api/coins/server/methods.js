import { Meteor } from 'meteor/meteor'
import { ActivityLog, Bounties, REWARDCOEFFICIENT, UserData,
  Currencies, PendingCurrencies, RejectedCurrencies, ChangedCurrencies,
  HashAlgorithm } from '/imports/api/indexDB.js'
import { rewardCurrencyCreator } from '/imports/api/utilities.js';
import { log } from '/server/main'

Meteor.methods({
  getLastCurrency: () => Currencies.find({}, {
    sort: {
      approvedTime: -1
    }
  }).fetch()[0],
  getCurrentReward: (userId, currencyName) => {
    let bounty = Bounties.findOne({
      userId: userId,
      type: 'new-currency',
      completed: true,
      id: currencyName
    })

    console.log(bounty)

    let lastCurrency = Currencies.find({}, {
      sort: {
        approvedTime: -1
      }
    }).fetch()[0]

    let currency = Currencies.findOne({
      currencyName: currencyName
    }) || {}

    if (bounty) {
      Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {})

      if (bounty.expiresAt < currency.createdAt) {
        console.log('already expired')
        return ((Date.now() - lastCurrency.approvedTime) / REWARDCOEFFICIENT) * 1.8
      } else {
        console.log('actual bounty')
        return Number(bounty.currentReward)
      }
    } else {
      console.log('no bounty')
      return ((Date.now() - lastCurrency.approvedTime) / REWARDCOEFFICIENT) * 1.8
    }
  },
  approveCurrency: function(currencyId) {
    if(UserData.findOne({_id: this.userId}).moderator) {
        var original = PendingCurrencies.findOne({_id: currencyId});
        if (original.owner == this.userId) {
          throw new Meteor.Error("Approving your own currency is no fun!")
        }

        var insert = _.extend(original, {
          approvedBy: this.userId,
          approvedTime: new Date().getTime()
        });
        Currencies.insert(insert, function(error, result) {
          if (!error) {
            ActivityLog.insert({
              owner: original.owner,
              content: "I have approved " + original.currencyName + " and it's now listed!",
              time: new Date().getTime(),
              from: Meteor.user().username,
              type: "message"
            });
            if(rewardCurrencyCreator(original.launchTags, original.owner, original.currencyName)) {//(creditUserWith(rewardFor(getRewardTypeOf(original.launchTags, "currency"), false)), original.owner) {
              PendingCurrencies.remove(currencyId);
            }

          }
        });
    }

  },
  rejectCurrency(name, id, owner, message, moderator) {
    if(UserData.findOne({_id: this.userId}).moderator) {
    var original = PendingCurrencies.findOne({_id: id});
    var insert = _.extend(original, {
      rejectedReason: message,
      rejectedBy: moderator
    });
    RejectedCurrencies.insert(insert, function(error, result) {
      if(!error) {
        ActivityLog.insert({
          owner: owner,
          content: name + " was incomplete or incorrect and has not been approved. Please see your moderated list for more information.",
          time: new Date().getTime(),
          from: Meteor.user().username,
          type: "message"
        });
        PendingCurrencies.remove({_id: id});
      }
    })
  }},

  setRejected(id, status) {
    if(UserData.findOne({_id: this.userId}).moderator) {
    PendingCurrencies.upsert({_id: id}, {
      $set: {rejected: status}
    })
  }},
  convertAlgorithm: () => {
    Currencies.find({}).fetch().forEach(i => {
      let algo = HashAlgorithm.findOne({
        name: new RegExp(i.hashAlgorithm, 'i')
      })

      if (algo) { // ensure idempotence
        Currencies.update({
          _id: i._id
        }, {
          $set: {
            hashAlgorithm: algo._id
          }
        })
      }
    })
  },
  isCurrencyNameUnique(name) {

    //only execute method if currenyName is supplied, null was causing issues in validating otherh fields
    if(name){
    name = name.toLowerCase()
    var res = PendingCurrencies.find({}, {fields: {currencyName: 1, id: -1}}).fetch().concat(Currencies.find({}, {fields: {currencyName: 1, id: -1}}).fetch()).filter(x => {
      console.log(res)
      return x.currencyName.toLowerCase() == name
    })

    console.log(res)
    if (res.length) {
      throw new Meteor.Error("Looks like " + name + " is already listed or pending approval on Blockrazor!");
    } else {return "OK"};
  }
  },
  addCoin(data) {
  //Check that user is logged in
  if (!Meteor.userId()) {throw new Meteor.Error("Please log in first")};
  Meteor.call('isCurrencyNameUnique', data.currencyName);

   //Initialize arrays to store which data.<item>s pass or fail validation
    var allowed = [];
    var error = [];

    //Function to validate data (checkSanity)
    var checkSanity = function (value, name, type, minAllowed, maxAllowed, nullAllowed) {
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
    if (data.consensusSecurity != "--Select One--") {
      checkSanity(data.consensusSecurity, "consensusSecurity", "string", 6, 20);
      } else {error.push("consensusSecurity")};
    if (data.hashAlgorithm) { if (data.hashAlgorithm == "--Select One--") {
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
      if (data.genesisTimestamp != 0) { if (data.genesisTimestamp < 1231006505000) {
        error.push("genesisTimestamp");
        allowed = allowed.filter(function(i) {return i != "genesisTimestamp"})
      }}
    }
//If the coin exists, no matter what it is
    if (altcoin && proposal) {
      checkSanity(data.genesisTimestamp, "intendedLaunch", "number", 13, 16);
      if (data.genesisTimestamp < 1509032068000) {
        error.push("genesisTimestamp");
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
        error.push("premine");
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
  if(error.length == 0 && _.size(data) == _.size(allowed)){
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
                .extent(size.width, size.height)
                .write(filename_thumbnail, function(error) {
                    if (error) console.log('Error - ', error);
                });
        }

      },
      fetchCurrencies(){
        return Currencies.find({}, {fields: {consensusSecurity: 0, hashAlgorithm: 0, gitAPI: 0}}).fetch()
    },
});

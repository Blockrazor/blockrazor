import { Meteor } from 'meteor/meteor';
import { PendingCurrencies } from '../../../lib/database/Currencies.js';
import { Currencies, ChangedCurrencies } from '../../../lib/database/Currencies.js'

if (Meteor.isServer) {

    Meteor.methods({
        editCoin(data) {
            //Check that user is logged in
            if (!Meteor.userId()) { throw new Meteor.Error("Please log in first") };

            //Initialize arrays to store which data.<item>s pass or fail validation
            var allowed = [];
            var error = [];

            //Function to validate data (checkSanity)
            var checkSanity = function(value, name, type, minAllowed, maxAllowed, nullAllowed) {
                if (type == "object") {
                    if (typeof value == type && _.size(value) >= minAllowed && _.size(value) <= maxAllowed && nullAllowed) {
                        allowed.push(name);
                        return true;
                    } else { error.push(name); return false; }
                }
                if (typeof value == type && value.toString().length >= minAllowed && value.toString().length <= maxAllowed && nullAllowed) {
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
                }
                if (data.launchTags[i].tag == "proposal") {
                    proposal = true;
                }
                if (data.launchTags[i].tag == "Bitcoin Fork") {
                    btcfork = true;
                }
                if (data.launchTags[i].tag == "ICO") {
                    ico = true;
                }
            }

            //compulsory checks
           if(data.launchTags) checkSanity(data.launchTags, "launchTags", "object", 1, 3,true);
            checkSanity(data.currencyName, "currencyName", "string", 3, 20,true);
            checkSanity(data.currencySymbol, "currencySymbol", "string", 2, 5,true);
            checkSanity(data.premine, "premine", "number", 1, 15,true);
            checkSanity(data.maxCoins, "maxCoins", "number", 4, 18,true);
            checkSanity(data.gitRepo, "gitRepo", "string", 18, 300,true);
            checkSanity(data.officialSite, "officialSite", "string", 6, 200,true);
           if(data.featureTags) checkSanity(data.featureTags, "featureTags", "object", 0, 50,true);

            //Check the self-populating dropdowns
            if (data.consensusSecurity != "--Select One--") {
                checkSanity(data.consensusSecurity, "consensusSecurity", "string", 6, 20,true);
            } else { error.push("consensusSecurity") };
            if (data.hashAlgorithm) {
                if (data.hashAlgorithm == "--Select One--") {
                    error.push("hashAlgorithm")
                } else {
                    checkSanity(data.hashAlgorithm, "hashAlgorithm", "string", 3, 40, true);
                }
            };

            //Check things that are always optional
            checkSanity(data.reddit, "reddit", "string", 12, 300, true);
            checkSanity(data.blockExplorer, "blockExplorer", "string", 6, 300, true);
            checkSanity(data.approvalNotes, "approvalNotes", "string", 0, 1000, true);

            //If this is a normal altcoin that already exists:
            if (altcoin && !proposal) {
                checkSanity(data.previousNames, "previousNames", "object", 0, 5,true);
                checkSanity(data.genesisTimestamp, "genesisTimestamp", "number", 13, 16,true);
                if (data.genesisTimestamp != 0) {
                    if (data.genesisTimestamp < 1231006505000) {
                        error.push("genesisTimestamp");
                        allowed = allowed.filter(function(i) { return i != "genesisTimestamp" })
                    }
                }
            }
            //If the coin exists, no matter what it is
            if (altcoin && proposal) {
                checkSanity(data.genesisTimestamp, "intendedLaunch", "number", 13, 16,true);
                if (data.genesisTimestamp < 1509032068000) {
                    error.push("genesisTimestamp");
                    allowed = allowed.filter(function(i) { return i != "genesisTimestamp" })
                }
            }

            //If this is an ICO (launched or not)
            if (ico) {
                checkSanity(data.ICOcoinsProduced, "ICOcoinsProduced", "number", 1, 15,true);
                checkSanity(data.ICOfundsRaised, "ICOfundsRaised", "number", 1, 15,true);
                checkSanity(data.icocurrency, "icocurrency", "string", 3, 3,true);
                if (data.premine < data.ICOcoinsProduced) {
                    error.push("premine");
                    allowed = allowed.filter(function(i) { return i != "premine" })
                };
            }

            //If this is an ICO that hasnt launched yet
            if (ico && proposal) {
                checkSanity(data.ICOcoinsIntended, "ICOcoinsIntended", "number", 1, 15,true);
                checkSanity(data.ICOnextRound, "ICOnextRound", "number", 13, 16,true);
                if (data.premine < data.ICOcoinsProduced + data.ICOcoinsIntended) {
                    error.push("premine");
                    allowed = allowed.filter(function(i) { return i != "premine" })
                };
            }
            //If this is a bitcoin fork (planned or existing)
            if (btcfork) {
                checkSanity(data.forkParent, "forkParent", "string", 6, 20, false,true);
                checkSanity(data.forkHeight, "forkHeight", "number", 6, 6, false,true);
                checkSanity(data.replayProtection, "replayProtection", "string", 4, 5, false)
            }
            //If this is not proposal
            if (!proposal) {
              if(data.exchanges)   checkSanity(data.exchanges, "exchanges", "object", 0, 15,true);
                checkSanity(data.blockTime, "blockTime", "number", 1, 4,true);
                checkSanity(data.confirmations, "confirmations", "number", 1, 4,true);

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





            if (error.length != 0) { throw new Meteor.Error(error) }
            if (error.length == 0) { //not worrying about size on updates as only a few fields could be changed
                console.log("----inserting------");
                // var insert = _.extend(data, {
                //     createdAt: new Date().getTime(),
                //     owner: Meteor.userId(),
                //     proposal: proposal,
                //     altcon: altcoin,
                //     ico: ico,
                //     btcfork: btcfork,
                //     bountiesCreated: false,
                // })



        for (var changed in data) {

               // changed.push({ [newValue]: { old: originalValue, new: insert[newValue] } });
console.log(data[changed])
                            ChangedCurrencies.insert(data[changed], function(error, result) {
                    if (!result) {
                        console.log(error);
                        //return error;
                        throw new Meteor.Error('Invalid', error);
                    } else {
                        //console.log(error);
                        console.log(result);
                        return "OK";
                    }
                });
        }

        //remove elements from array if they have not changed

                // PendingCurrencies.insert(insert, function(error, result) {
                //     if (!result) {
                //         console.log(error);
                //         //return error;
                //         throw new Meteor.Error('Invalid', error);
                //     } else {
                //         //console.log(error);
                //         console.log(result);
                //         return "OK";
                //     }
                // });
            } else { console.log("did not run insert function") }



        },
        'changeCoinImage': function(fileName, imageOf, currencyId, binaryData, md5) {
            var error = function(error) { throw new Meteor.Error('error', error); }

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

            var insert = false;

            if (!validFile) {
                throw new Meteor.Error('Error', 'File type not supported, png, gif and jpeg supported');
                return false;
            }

            fs.writeFile(filename, binaryData, { encoding: 'binary' }, Meteor.bindEnvironment(function(error) {
                if (error) {
                    log.error('Error in file upload in uploadCoinImage', error)
                };


            }));

        }
    });
}
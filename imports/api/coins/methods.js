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


Meteor.methods({
    getLastCurrency: () => {
        let pending = PendingCurrencies.find({}, {
          sort: {
            createdAt: -1
          }
        }).fetch()[0]
    
        if (!pending) { // in case there's no pending currencies, use the last added currency
          pending = Currencies.find({}, {
            sort: {
              createdAt: -1
            }
          }).fetch()[0]
        }
    
        return pending
      },
      getCurrentReward: (userId, currencyName) => {
        let bounty = Bounties.findOne({
          userId: userId,
          type: 'new-currency',
          completed: true,
          id: currencyName
        })
    
        let lastCurrency = PendingCurrencies.find({}, {
          sort: {
            createdAt: -1
          }
        }).fetch()[0]
    
        if (!lastCurrency) { // in case there's no pending currencies, use the last added currency
          lastCurrency = Currencies.find({}, {
            sort: {
              createdAt: -1
            }
          }).fetch()[0]
        }
    
        let currency = Currencies.findOne({
          currencyName: currencyName
        }) || {}
    
        if (bounty) {
          Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {})
    
          if (bounty.expiresAt < currency.createdAt) {
            console.log('already expired')
            return ((Date.now() - lastCurrency.createdAt) / REWARDCOEFFICIENT) * 1.8
          } else {
            console.log('actual bounty')
            return Number(bounty.currentReward)
          }
        } else {
          console.log('no bounty')
          return ((Date.now() - lastCurrency.createdAt) / REWARDCOEFFICIENT) * 1.8
        }
      },
      reviewCurrency: function(currencyId) {
        if(UserData.findOne({_id: this.userId}).moderator) {
            var original = PendingCurrencies.findOne({_id: currencyId});
    
            return original;
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

            if(Currencies.findOne({_id: currencyId})) {
              // already approved
              // remove from approval queue
              PendingCurrencies.remove(currencyId);
              throw new Meteor.Error("Currency already approved. Removed from approval queue.")
            }else {
              var insertedId = Currencies.insert(insert)
              
              if (insertedId) {
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
            }
        }
    
      },
    voteOnCurrencyChange(voteType, data) {

        //check if logged in
        if (!Meteor.userId()) {
            throw new Meteor.Error("Please log in first")
        };

        let clientAddress = "0.0.0.0";
        let httpHeaders = ""
        if ( Meteor.isServer ){
          clientAddress = this.connection.clientAddress
          httpHeaders = this.connection.httpHeaders
        }

        let isModerator = UserData.findOne({
            _id: this.userId
        }, {
            fields: {
                moderator: true
            }
        });

        if (!isModerator.moderator) {
            throw new Meteor.Error("moderatorOnlyAction")
        };


        if (voteType == 'currencyVoteBtnUp') {
            var voteComputation = 1;
            var voteType = 'upvote';
            var revertVoteType = 'downvote';
        } else if (voteType == 'currencyVoteBtnDown') {
            var voteType = 'downvote';
            var voteComputation = -1;
            var revertVoteType = 'upvote';
        } else {

            throw new Meteor.Error("ERROR: Invalid vote type invoked")
        }
        //Check if user has aleady voted
        let voteCasted = ChangedCurrencies.find({
            _id: data._id,
            'voteMetrics.userId': this.userId
        }).count();

        //throw exception if mod is voting for his own proposed coin change
        let createdByYou = ChangedCurrencies.find({
            _id: data._id,
            'createdBy': this.userId
        }).count();

        if (createdByYou) {
            throw new Meteor.Error("noVoteOnOwn");
        }

        if (voteCasted) {

            ChangedCurrencies.update({
                _id: data._id,
                'voteMetrics.userId': this.userId
            }, {
                $inc: {
                    score: voteComputation
                },
                $pull: {
                    voteMetrics: {
                        userId: this.userId
                    }
                }

            })

            ChangedCurrencies.update({
                _id: data._id,
                'voteMetrics.userId': this.userId
            }, {
                $inc: {
                    [voteType]: 1,
                    [revertVoteType]: -1,
                },
                $push: {
                    voteMetrics: {
                        voteType: voteType,
                        userId: this.userId,
                        status: 'active',
                        loggedIP: clientAddress,
                        headerData: httpHeaders, // this could be a problem in the future, it's quite a big object
                        time: new Date().getTime()
                    }
                }
            })
        } else {
            ChangedCurrencies.update({
                _id: data._id
            }, {
                $inc: {
                    [voteType]: 1,
                    score: voteComputation
                },
                $push: {
                    voteMetrics: {
                        voteType: voteType,
                        userId: this.userId,
                        status: 'active',
                        loggedIP: clientAddress,
                        headerData: httpHeaders, // this could be a problem in the future, it's quite a big object
                        time: new Date().getTime()
                    }
                }
            })
        }

        //Calculate if the vote should merge the proposedcoin change
        let approveChange = ChangedCurrencies.findOne({
            _id: data._id
        }, {
            fields: {
                score: 1,
                upvote: 1,
                downvote: 1
            }
        });

        let totalVotes = approveChange.upvote + approveChange.downvote;
        let mergeScore = approveChange.downvote / totalVotes;

        if (approveChange.score > _coinApprovalThreshold || mergeScore < 0.2) {
            console.log('coin approved')
            //update currency to approved
            ChangedCurrencies.update({
                _id: data._id
            }, {
                $set: {
                    status: 'merged'
                }
            })

            if (data.field === 'previousNames') {
                data.new = data.new.split(',').map(i => ({ // comma separated values
                    tag: i.trim()
                }))
            } // get the previous names array into the correct format

            //merge changes into currencies collection
            Currencies.update({
                _id: data.coin_id
            }, {
                $set: {
                    [data.field]: data.new
                }
            })
            return 'merged';
        }

        //Should we delete the proposed change if it gets a certain amount of downvotes
        if (approveChange.downvote > _coinMergeDeleteThreshold) {
            ChangedCurrencies.update({
                _id: data._id
            }, {
                $set: {
                    status: 'deleted'
                }
            })
            return 'deleted';
        }

    },
    isCurrencyNameUnique(name) {

        //only execute method if currenyName is supplied, null was causing issues in validating otherh fields
        if(name){
        name = name.toLowerCase()
        var res = PendingCurrencies.find({}, {fields: {currencyName: 1, id: 1}}).fetch().concat(Currencies.find({}, {fields: {currencyName: 1, id: 1}}).fetch()).filter(x => {
          return x.currencyName.toLowerCase() == name
        })
    
        if (res.length) {
          throw new Meteor.Error("Looks like " + name + " is already listed or pending approval on Blockrazor!");
        } else {return "OK"};
      }
      },
    editCoin(data) {
        //Check that user is logged in
        if (!Meteor.userId()) {
            throw new Meteor.Error("Please log in first")
        };

        //check to see if a coin change exists already, if so, thow an exception.
        let coinChangeExist = ChangedCurrencies.find({
            coin_id: data[0].coin_id,
            field: data[0].field,
            status: 'pending review'
        }).count();

        if (coinChangeExist >= 1) {
            throw new Meteor.Error("A change already exists for this field")
        };


        //Initialize arrays to store which data.<item>s pass or fail validation
        var allowed = [];
        var error = [];

        //Function to validate data (checkSanity)
        var checkSanity = function (value, name, type, minAllowed, maxAllowed, nullAllowed) {
            if (type == "object") {
                if (typeof value == type && _.size(value) >= minAllowed && _.size(value) <= maxAllowed && nullAllowed) {
                    allowed.push(name);
                    return true;
                } else {
                    error.push(name);
                    return false;
                }
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
        if (data.launchTags) checkSanity(data.launchTags, "launchTags", "object", 1, 3, true);
        checkSanity(data.currencyName, "currencyName", "string", 3, 20, true);
        checkSanity(data.currencySymbol, "currencySymbol", "string", 2, 5, true);
        checkSanity(data.premine, "premine", "number", 1, 15, true);
        checkSanity(data.maxCoins, "maxCoins", "number", 4, 18, true);
        checkSanity(data.gitRepo, "gitRepo", "string", 18, 300, true);
        checkSanity(data.officialSite, "officialSite", "string", 6, 200, true);
        checkSanity(data.officialSite, "currencyLogoFilename", "string", 6, 200, true);
        checkSanity(data.createdBy, "createdBy", "string", 6, 200, true);

        //Check the self-populating dropdowns
        if (data.consensusSecurity != "--Select One--") {
            checkSanity(data.consensusSecurity, "consensusSecurity", "string", 6, 20, true);
        } else {
            error.push("consensusSecurity")
        };
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
            checkSanity(data.previousNames, "previousNames", "object", 0, 5, true);
            checkSanity(data.genesisTimestamp, "genesisTimestamp", "number", 13, 16, true);
            if (data.genesisTimestamp != 0) {
                if (data.genesisTimestamp < 1231006505000) {
                    error.push("genesisTimestamp");
                    allowed = allowed.filter(function (i) {
                        return i != "genesisTimestamp"
                    })
                }
            }
        }
        //If the coin exists, no matter what it is
        if (altcoin && proposal) {
            checkSanity(data.genesisTimestamp, "intendedLaunch", "number", 13, 16, true);
            if (data.genesisTimestamp < 1509032068000) {
                error.push("genesisTimestamp");
                allowed = allowed.filter(function (i) {
                    return i != "genesisTimestamp"
                })
            }
        }

        //If this is an ICO (launched or not)
        if (ico) {
            checkSanity(data.ICOcoinsProduced, "ICOcoinsProduced", "number", 1, 15, true);
            checkSanity(data.ICOfundsRaised, "ICOfundsRaised", "number", 1, 15, true);
            checkSanity(data.icocurrency, "icocurrency", "string", 3, 3, true);
            if (data.premine < data.ICOcoinsProduced) {
                error.push("premine");
                allowed = allowed.filter(function (i) {
                    return i != "premine"
                })
            };
        }

        //If this is an ICO that hasnt launched yet
        if (ico && proposal) {
            checkSanity(data.ICOcoinsIntended, "ICOcoinsIntended", "number", 1, 15, true);
            checkSanity(data.ICOnextRound, "ICOnextRound", "number", 13, 16, true);
            if (data.premine < data.ICOcoinsProduced + data.ICOcoinsIntended) {
                error.push("premine");
                allowed = allowed.filter(function (i) {
                    return i != "premine"
                })
            };
        }
        //If this is a bitcoin fork (planned or existing)
        if (btcfork) {
            checkSanity(data.forkParent, "forkParent", "string", 6, 20, false, true);
            checkSanity(data.forkHeight, "forkHeight", "number", 6, 6, false, true);
            checkSanity(data.replayProtection, "replayProtection", "string", 4, 5, false)
        }
        //If this is not proposal
        if (!proposal) {
            if (data.exchanges) checkSanity(data.exchanges, "exchanges", "object", 0, 15, true);
            checkSanity(data.blockTime, "blockTime", "number", 1, 4, true);
            checkSanity(data.confirmations, "confirmations", "number", 1, 4, true);

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

        if (error.length != 0) {
            throw new Meteor.Error(error)
        }
        if (error.length == 0) { //not worrying about size on updates as only a few fields could be changed


            for (var changed in data) {

                // changed.push({ [newValue]: { old: originalValue, new: insert[newValue] } });

                ChangedCurrencies.insert(data[changed], function (error, result) {
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


        } else {
            console.log("did not run insert function")
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
            PendingCurrencies.remove({_id: id})
    
            Meteor.call('userStrike', owner, 'bad-coin', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here
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
    fetchCurrencies(){
        return Currencies.find({}, {fields: {hashAlgorithm: 0, gitAPI: 0}}).fetch().map(i => _.extend(i, {
          quality: quality(i)
        }))
    },
});
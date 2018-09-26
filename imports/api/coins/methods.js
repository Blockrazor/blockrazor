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
import SimpleSchema from 'simpl-schema';
import { Promise } from 'meteor/promise'


//can't extend custom/autoValue fields therefore some of the form related parsers/validators may reside on original schema
Currencies.newCoinSchema = new SimpleSchema(Currencies.schema.pick(
    'currencyName', 'currencySymbol', 'premine', 'maxCoins', 'consensusSecurity', 'gitRepo', 
'officialSite', 'reddit', 'blockExplorer', 'currencyLogoFilename', 'confirmations', 'previousNames', 'exchanges', 
'launchTags', 'blockTime', 'forkHeight', 'forkParent', 'hashAlgorithm', 'ICOfundsRaised', 'genesisTimestamp', 'proposal', 'altcoin', 
'ico', 'ICOcoinsProduced', 'ICOcoinsIntended',  'ICOnextRound', 'icoDateEnd', 'btcfork', 'approvalNotes', 'smartContractURL', 'smartContract','icocurrency',
'replayProtection'
)
.extend({
    proposal: { 
        autoValue() {
            return Currencies.schemaFuncs.launchTagsAuto.call(this)
        }
    },
    altcoin: { 
        autoValue() {
            return Currencies.schemaFuncs.launchTagsAuto.call(this)
        }
    },
    ico: { 
        autoValue() {
            return Currencies.schemaFuncs.launchTagsAuto.call(this)
        }
    },
    btcfork: { 
        autoValue() {
            return Currencies.schemaFuncs.launchTagsAuto.call(this)
        }
    },
    smartContract: { 
        autoValue() {
            return Currencies.schemaFuncs.launchTagsAuto.call(this)
        }
    },
    consensusSecurity: {
        custom() {
            return Currencies.schemaFuncs.checkForDropdown.call(this, "--Select One--")
        },
    },
    hashAlgorithm: {
        custom(){
            return Currencies.schemaFuncs.checkForDropdown.call(this, "--Select One--")
        },
    },
    genesisTimestamp: {
        autoValue() {
            if (!this.field("genesisYear").isSet) return;
            return Date.parse(this.field("genesisYear").value)
        },
    },

})
,{requiredByDefault: developmentValidationEnabledFalse,
})
Currencies.newCoinSchema.messageBox.messages({
    en: {
        "Premine lower then produced": "Premine lower then produced.",
        "Premine lower then produced and intended": "Premine lower then produced and intended."
    }
})

export const addCoin = new ValidatedMethod({
    name: 'addCoin',
    validate: Currencies.newCoinSchema.validator({clean: true}),
    run({currencyName, currencySymbol, premine, maxCoins, consensusSecurity, gitRepo, 
        officialSite, reddit, blockExplorer, currencyLogoFilename, confirmations, previousNames, exchanges, 
        launchTags, blcokTime, forkHeight, forkParent, hashAlgorithm, ICOfundsRaised, genesisTimestamp, proposal, altcoin, 
        ico, ICOcoinsProduced, ICOcoinsIntended,  ICOnextRound, icoDateEnd, btcfork, approvalNotes,smartContractURL,smartContract, icocurrency,
replayProtection}) {
            //data should be used since some of items may be undefined
            var data = {currencyName, currencySymbol, premine, maxCoins, consensusSecurity, gitRepo, 
                officialSite, reddit, blockExplorer, currencyLogoFilename, confirmations, previousNames, exchanges, 
                launchTags, blcokTime, forkHeight, forkParent, hashAlgorithm, ICOfundsRaised, genesisTimestamp, proposal, altcoin, 
                ico, ICOcoinsProduced, ICOcoinsIntended,  ICOnextRound, icoDateEnd, btcfork, approvalNotes,smartContractURL,smartContract, icocurrency,
replayProtection}
            if (Meteor.isServer){
        var Future = require('fibers/future')
        var fut = new Future()
            }
        //Check that user is logged in
        if (!Meteor.userId()) {
            throw new Meteor.Error("Please log in first")
        };
        Meteor.call('isCurrencyNameUnique', data.currencyName);


        // //both compulsory and optional
        // checkSanity(data.reddit, "reddit", "string", 12, 300, true);
        // checkSanity(data.blockExplorer, "blockExplorer", "string", 6, 300, true);
        // checkSanity(data.approvalNotes, "approvalNotes", "string", 0, 1000, true);


        if (data.questions && data.questions.length) {

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
            })
        }

            //so long as validation is enabled in dev environment
            if (developmentValidationEnabledFalse) {
                //add the algorithm if it doesn't exist, 
                // if (Meteor.isServer){
                if (!HashAlgorithm.findOne({
                        _id: data.hashAlgorithm
                    })) {
                    Meteor.call('addAlgo', data.hashAlgorithm, data.consensusSecurity.toLowerCase().split(' ').reduce((i1, i2) => i1 + i2[0], ''), (err, data) => { // 'Proof of Work' -> 'pow'
                        if (!err) {
                             if (Meteor.isServer) fut.return(data)
                        } else {
                            throw new Meteor.Error('Error.', err.reason)
                        }
                    })
                } else {
                    if (Meteor.isServer) fut.return(data.hashAlgorithm)
                }

                if (Meteor.isServer) data.hashAlgorithm = fut.wait()
            }

            console.log("----inserting------");
            var insert = _.extend(data, {
                createdAt: new Date().getTime(),
                owner: Meteor.userId(),
                proposal: proposal,
                altcon: altcoin,
                ico: ico,
                btcfork: btcfork,
                smartContract: smartContract,
                bountiesCreated: false
            })
            PendingCurrencies.insert(insert, function (error, result) {
                if (!result) {
                    console.log(error, error.reason);
                    //return error;
                    throw new Meteor.Error('Invalid', error);
                } else {
                    //console.log(error);
                    console.log(result)
                    return "OK";
                }
            });
    }
})

let editCoinChangedFieldSchema = new SimpleSchema(Currencies.schema.pick('currencyName', 'currencySymbol', 'gitRepo', 'officialSite','smartContractURL', 'genesisTimestamp', 'hashAlgorithm', 'premine', 'maxCoins', 'consensusSecurity', 'currencyLogoFilename')
    .extend({
        consensusSecurity: {
            custom() {
                return Currencies.schemaFuncs.checkForDropdown.call(this, "--Select One--")
            },
        },
        hashAlgorithm: {
            custom(){
                return Currencies.schemaFuncs.checkForDropdown.call(this, "--Select One--")
            },
        },
        genesisTimestamp: {
            autoValue() {
                if (!this.field("genesisYear").isSet) return;
                return Date.parse(this.field("genesisYear").value)
            },
        }
    }), {
        requiredByDefault: developmentValidationEnabledFalse
    })

const {
  Integer,
  RegEx,
  oneOf
} = SimpleSchema

const {
  Id,
  Domain
} = RegEx

editCoinChangedFieldSchema._firstLevelSchemaKeys.forEach(i => {
    editCoinChangedFieldSchema.extend({
        [i]: {
            optional: true
        }
    }) // make them all optional
})

editCoinChangedFieldSchema.extend({
    previousNames: {
        type: String,
        optional: true
    }
})

const editCoinFormSchema =  new SimpleSchema({
    coin_id: {
        type: Id
    },
    coinName: {
        type: String,
        min: 3,
        max: 20
    },
    changed: editCoinChangedFieldSchema,
    old: SimpleSchema.oneOf({
        type: String
    }, {
        type: Number
    }),
    changedDate: {
        type: Number
    },
    createdBy: {
        type: String
    },
    score: {
        type: Number
    },
    status: {
        type: String
    },
    notes: {
        type: String
    }
}, {
    requiredByDefault: developmentValidationEnabledFalse
})

export const editCoin = new ValidatedMethod({
    name: 'editCoin',
    validate: editCoinFormSchema.validator({}),
    run({coin_id, coinName, changed, old, changedDate, createdBy, score, status, notes}) {
        //data should be used since some of items may be undefined
        const data = {coin_id, coinName, old, changed, changedDate, createdBy, score, status, notes}

        // convert new input data to the old system (adapter)
        data.field = Object.keys(changed)[0]
        data.new = data.changed[data.field]

        delete data.changed

        if (!Meteor.userId()) {
            throw new Meteor.Error('messages.login')
        }

        //check to see if a coin change exists already, if so, thow an exception.
        let coinChangeExist = ChangedCurrencies.find({
            coin_id: data.coin_id,
            field: data.field,
            status: 'pending review'
        }).count()

        if (coinChangeExist >= 1) {
            throw new Meteor.Error("messages.coins.change_exists")
        }

        if (data.field === 'currencyName') {
            Meteor.call('isCurrencyNameUnique', data.new)
        }

        ChangedCurrencies.insert(data, (error, result) => {
            if (!result) {
                console.log(error)
                
                throw new Meteor.Error('Invalid', error)
            } else {
                return 'ok'
            }
        })
    }
})

if (Meteor.isDevelopment) {
    Meteor.methods({
        generateTestCurrencies: () => {
            Currencies.remove({}) // delete all previous ones as this may cause problems
            
            for (let i = 0; i < 10; i++) {
                Currencies.insert({
                    currencyName: `Test ${i}`,
                    currencySymbol: `TST${i}`,
                    createdAt: new Date().getTime(),
                    owner: 'randId'
                })
            }
        },
        newTestCurrency: () => {
            Currencies.insert({
                currencyName: 'ZNew name', // go after test ones
                currencySymbol: 'NNN',
                createdAt: new Date().getTime(),
                owner: 'randId'
            })
        }
    })
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

Meteor.methods({
    fetchRelatedGithubRepos: () => {
        let allCurrencies = Currencies.find({}).fetch()
        
        let count = 0
        allCurrencies.forEach(el => {
            ++count
            HTTP.get(`https://api.github.com/search/repositories?q=${el.currencyName}&sort=stars&order=desc`, {
                headers: {
                    'User-Agent': 'Blockrazor/bot',
                    'Accept': 'application/vnd.github.mercy-preview+json'
                }
            }, (err, data) => {
                if (!err) {
                    let items = data.data.items

                    items = items.map(i => ({
                        id: i.id,
                        name: i.full_name,
                        html_url: i.html_url,
                        fork: i.fork,
                        created_at: i.created_at,
                        updated_at: i.updated_at,
                        stargazers_count: i.stargazers_count,
                        watchers_count: i.watchers,
                        language: i.language,
                        forks_count: i.forks_count,
                        score: i.score
                    }))

                    let languages = {}

                    items.forEach(j => languages[j.language] = (languages[j.language] || 0) + 1)

                    Currencies.update({
                        _id: el._id
                    }, {
                        $set: {
                            relatedRepos: items,
                            gitStats: {
                                related: data.data.total_count,
                                watchers: items.reduce((i1, i2) => i1 + Number(i2.watchers_count), 0),
                                likes: items.reduce((i1, i2) => i1 + Number(i2.stargazers_count), 0),
                                avgWatchers: Math.round(items.reduce((i1, i2) => i1 + Number(i2.watchers_count), 0) / (items.length || 1)),
                                topLanguages: Object.keys(languages).sort((i1, i2) => languages[i2] - languages[i1]).filter(i => i && i !== 'null').slice(0, 5)
                            }
                        }
                    })
                }
            })

            Promise.await(sleep(500))

            if (count >= 60) {
                count = 0

                Promise.await(sleep(1000*60*60)) // wait for an hour to prevent github rate limiting, in non-blocking manner
            }
        })
    },
    getTotalCurrencies: () => Currencies.find({}).count(),
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
      approveCurrency: function(currencyId) {
        if(UserData.findOne({_id: this.userId}).moderator) {
            var original = PendingCurrencies.findOne({_id: currencyId});
            if (original.owner == this.userId) {
              throw new Meteor.Error('messages.coins.approving_own')
            }
    
            var insert = _.extend(original, {
              approvedBy: this.userId,
              approvedTime: new Date().getTime()
            });

            if(Currencies.findOne({_id: currencyId})) {
              // already approved
              // remove from approval queue
              PendingCurrencies.remove(currencyId);
              throw new Meteor.Error('messages.coins.already_approved')
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
            throw new Meteor.Error('messages.login')
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

            throw new Meteor.Error('messages.coins.invalid_vote')
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
          throw new Meteor.Error('messages.coins.already_here');
        } else {return "OK"};
      }
      },
    rejectCurrency(name, id, owner, message, moderator) {
        if(UserData.findOne({_id: this.userId}).moderator) {
        var original = PendingCurrencies.findOne({_id: id});
        var insert = _.extend(original, {
          rejectedReason: message,
          rejectedBy: Meteor.user().username
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
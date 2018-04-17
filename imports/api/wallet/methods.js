import { Meteor } from 'meteor/meteor'
import { Wallet, WalletImages, Currencies, Ratings, Bounties, REWARDCOEFFICIENT } from '/imports/api/indexDB.js'
import { creditUserWith, removeUserCredit } from '/imports/api/utilities.js'
import { sendMessage } from '/imports/api/activityLog/methods'
import { log } from '/imports/api/utilities'

Meteor.methods({
	initializeWallet: function() {
		if (_.size(Wallet.findOne({owner: this.userId})) == 0) {
			Wallet.insert({
				time: new Date().getTime(),
				owner: this.userId,
				type: "transaction",
				from: "System",
				message: "Welcome to Blockrazor! Your wallet has been created. Why not head over to the Bounty list and earn your first Rozar!",
				amount: 0
			})
		}
    },

	getWalletReward: (userId, rId) => {
        let bounty = Bounties.findOne({
            userId: userId,
            type: 'new-wallet'
        }, {
            sort: {
                expiresAt: -1
            }
        })

        let lastWalletAnswer = Ratings.find({
            $or: [{
                catagory: 'wallet'
            }, {
                context: 'wallet'
            }]
        }, {
            sort: {
                answeredAt: -1
            }
        }).fetch()[0]

        let r = Ratings.findOne({
            _id: rId
        }) || {}

        let count = Ratings.find({
            $or: [{
                answered: false,
                catagory: 'wallet'
            }, {
                answered: false,
                context: 'wallet'
            }],
            owner: userId
        }).count()

        let rCount = Ratings.find({
            $or: [{
                processed: false,
                catagory: 'wallet'
            }, {
                processed: false,
                context: 'wallet'
            }],
            owner: userId
        }).count()

        if (bounty) {
            if (!count) {
                Meteor.call('deleteNewBounty', bounty._id, 's3rver-only', (err, data) => {}) // delete the bounty, we're done with it
            }

            if (bounty.expiresAt < r.answeredAt) {
                console.log('already expired')
                return (((Date.now() - lastWalletAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3) / (rCount || 1)
            } else {
                console.log('actual bounty')
                Meteor.call('saveLastData', bounty._id, new Date().getTime(), (err, data) => {})
                return Number(bounty.currentReward) / (rCount || 1)
            }
        } else {
            console.log('no bounty')
            return (((Date.now() - lastWalletAnswer.answeredAt) / REWARDCOEFFICIENT) * 0.3) / (rCount || 1)
        }
    },

	portWalletImages: () => {
		WalletImages.find({}).fetch().forEach(i => {
			if (!i.currencySlug) {
				WalletImages.update({
					_id: i._id
				}, {
					$set: {
						currencySlug: (Currencies.findOne({ _id: i.currencyId }) || {}).slug
					}
				})
			}
		})
	},

	flagWalletImage: function(imageId,rejectReason) {
		if (!this.userId) {
			throw new Meteor.Error('error', 'please log in')
		}

		let wallet = WalletImages.findOne({
            _id: imageId
        })

        if (wallet) {

        	sendMessage(wallet.createdBy, ("The wallet image you submitted for " + wallet.currencyName + " has been rejected by a moderator. The moderators reasons is: " + rejectReason))

            let ratings = Ratings.find({
                $and: [{
                    $or: [{
                        currency0Id: wallet.currencyId
                    }, {
                        currency1Id: wallet.currencyId
                    }]
                }, {
                    $or: [{
                        catagory: 'wallet'
                    }, {
                        context: 'wallet'
                    }]
                }, {
                    owner: wallet.createdBy,
                    processed: false
                }]
            }).fetch() // get all unprocessed ratings associated with this wallet image

            let reward = ratings.reduce((i1, i2) => i1 + (i2.reward || 0), 0)

            removeUserCredit(reward, Meteor.userId(), 'posting an invalid wallet screenshot','cheating') // remove all credit user has gained from this

            Ratings.remove({
                _id: {
                    $in: ratings.map(i => i._id)
                }
            }) // remove only unprocessed ratings associated with this wallet image, as processed ones are already part of the ELO calculation and can't be removed

            Meteor.call('userStrike', Meteor.userId(), 'bad-wallet', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here

            WalletImages.remove({
                _id: imageId
            }) // finally,remove the offending community so the user can add a new one in it's place
        }
	},

	approveWalletImage: function(imageId) {
		if (!this.userId) {
			throw new Meteor.Error('error', 'please log in')
		}

		if (WalletImages.findOne({
			_id: imageId
		}).createdBy === this.userId) {
			throw new Meteor.Error('Error', 'You can\'t approve your own item.')
		}

		WalletImages.update({
			_id: imageId
		}, {
			$set: {
				approved: true,
				approvedBy: this.userId
			},
			$inc: {
				likes: 1
			}
		})
	},

	deleteWalletRatings: () => {
        let rem = Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                catagory: 'wallet'
            }, {
                owner: Meteor.userId(),
                processed: false,
                answered: true,
                context: 'wallet'
            }]
        }).fetch()

        let reward = rem.reduce((i1, i2) => i1 + (i2.reward || 0), 0)

        Ratings.update({
            $or: [{
                owner: Meteor.userId(),
                processed: false,
                catagory: 'wallet'
            }, {
                owner: Meteor.userId(),
                processed: false,
                context: 'wallet'
            }]
        }, {
            $set: {
                answered: false,
                answeredAt: null,
                winner: null,
                loser: null,
                reward: 0
            }
        }, {
            multi: true
        }) // reset only ratings from this session, don't reset already processed ratings, as this would mess up previous ELO calculations

        removeUserCredit(reward, Meteor.userId(), 'cheating on wallet questions','cheating')

        Meteor.call('userStrike', Meteor.userId(), 'cheating', 's3rv3r-only', (err, data) => {}) // user earns 1 strike here
    },

	getLastWalletAnswer: () => {
        return Ratings.find({
            $or: [{
                catagory: 'wallet'
            }, {
                context: 'wallet'
            }]
        }, {
            sort: {
                answeredAt: -1
            }
        }).fetch()[0]
    },

    markAsRead: function(currency) {
		if (!Meteor.userId()) { throw new Meteor.Error('error', 'please log in') };

		var filterOptions = {};

		if (currency === 'kzr') {
			filterOptions = {
				owner: Meteor.userId,
				currency: { $exists: false }
			}
		} else {
			filterOptions = {
				owner: Meteor.userId,
				currency: currency.toUpperCase()
			}
		}

		Wallet.update(filterOptions, {$set: { read: true }}, { multi: true },
			function(error) {
				if (error) {
					log.error('Error in markNotificationsAsRead', error)
					throw new Meteor.Error(500, error.message);
				}
			}
		);
	},

	transactionCount: () => {
		return Wallet.find({
			type: 'transaction',
			amount: { $nin: [0, NaN] } // filter out invalid transactions}
		}).count()
	},

	totalAmount: () => {
		let transactions = Wallet.find({
			$or: [{
		        currency: 'KZR'
		    }, {
		      	currency: {
		       		$exists: false
		       	}
		    }]
		}).fetch()
		let sum = 0

		transactions.forEach(i => {
			// sum only transactions from the main wallet
			sum += (((i.from === 'System' || i.from === 'Blockrazor') && !isNaN(i.amount)) ? i.amount : 0)
		})

		return  parseFloat(sum).toFixed(2)
	},

	transactions: (page,rewardType) => {

		if (rewardType) {
		    var query = {
		        rewardType: rewardType,
		        type: 'transaction',
		        amount: {
		            $nin: [0, NaN] // filter out invalid transactions
		        }
		    }
		} else {
		    var query = {
		        type: 'transaction',
		        amount: {
		            $nin: [0, NaN] // filter out invalid transactions
		        }
		    }
		}

		return Wallet.find(query, {
			sort: { time: -1 },
			fields: {
				time: 1,
				owner: 1,
				from: 1,
				amount: 1,
				rewardType: 1,
				currency: 1
			},
			skip: (page - 1) * 10,
			limit: 10 // show 10 transactions per page
		}).fetch()
	},

	uploadWalletImage: function (fileName, imageOf, currencyId, binaryData, md5) {
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
		var filename_thumbnail = (_walletUpoadDirectory + md5 + '_thumbnail.' + fileExtension);
		var filenameWatermark = (_walletUpoadDirectory + md5 + '_watermark.' + fileExtension);
		var insert = false;

		if (!validFile) {
			throw new Meteor.Error('Error', 'File type not supported, png, gif and jpeg supported');
			return false;
		}

		let currency = Currencies.findOne({_id:currencyId}) || {}
		if(!currency.currencyName){
			throw new Meteor.Error('error', 'error 135');
		}

		try {
			insert = WalletImages.insert({
				_id: md5,
				'currencyId':currencyId,
				'currencySlug': currency.slug,
				'currencyName': currency.currencyName,
				'imageOf': imageOf,
				'createdAt': new Date().getTime(),
				'createdBy': this.userId,
				'flags': 0,
				'likes': 0,
				'extension': fileExtension,
				'flaglikers': [],
				'approved': false,
				'allImagesUploaded': false
			});
		} catch(error) {
			throw new Meteor.Error('Error', 'That image has already been used on Blockrazor. You must take your own original screenshot of the wallet.');
		}
		//check if three files have been uploaded
		let walletCheckCount = WalletImages.find({currencyId:currencyId,createdBy:this.userId}).count();
		if(walletCheckCount===3){
			WalletImages.update({currencyId:currencyId,createdBy:this.userId},{$set: {allImagesUploaded: true}},{multi: true});
		}

		if(insert != md5) {throw new Meteor.Error('Error', 'Something is wrong, please contact help.');}

		fs.writeFileSync(filename, binaryData, {encoding: 'binary'}, Meteor.bindEnvironment(function(error){
			if(error){
				log.error('Error in uploadWalletImage', error)
			};
		}))

		//Add watermark to image
		if (gm.isAvailable) {
			//create thumbnail
			var size = { width: 200, height: 200 };
			gm(filename)
				.resize(size.width, size.height + ">")
				.gravity('Center')
				.write(filename_thumbnail, function(error) {
					if (error) console.log('Error - ', error);
				});

			gm(filename)
				.command('composite')
				.gravity('SouthEast')
				.out('-geometry', '+1+1')
				.in(_watermarkLocation)
				.write(filenameWatermark, Meteor.bindEnvironment(function(err, stdout, stderr, command) {
					if (err) console.error(err)
					//Delete original if no errors
					fs.unlinkSync(filename);
					//Old file gone, let's rename to just the md5 no need for watermark tag
					fs.rename(filenameWatermark, filename, function(err) {
						if (err) console.error('ERROR: ' + err);
					});
				}))
		}else{
			log.error('required gm dependicies are not available', {})
		}
	},

	deleteWalletImage: function(imageOf, currencyId) {
		const fs = require('fs')
		var error = function(error) { throw new Meteor.Error('error', error); }

		if (!this.userId) {
			console.log("NOT LOGGED IN");
			throw new Meteor.Error('error', 'You must be logged in to do this.');
			return false;
		}

		//remove image from file serverp
		let imageID = WalletImages.findOne({ currencyId: currencyId, imageOf: imageOf, createdBy: this.userId});
		let filename = imageID._id +'.'+ imageID.extension;
		fs.unlinkSync(_walletUpoadDirectory + filename)

		//remove all walletImages per query below
		WalletImages.remove({ currencyId: currencyId, imageOf: imageOf, createdBy: this.userId})
	}
});

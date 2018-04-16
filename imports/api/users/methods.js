import { Meteor } from 'meteor/meteor'
import {  ProfileImages, UserData, Wallet, ProblemComments, Features, Redflags, Summaries } from '/imports/api/indexDB.js'
import { check } from 'meteor/check'
import { creditUserWith } from '/imports/api/utilities.js'

Meteor.methods({
  signedUpLastMonth: () => {
  	return Meteor.users.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30) /* 30 days */).length
  },
  sidebarPreference: function(value, valueOnRecord) {
    //ignore request if valueOnRecord provided from beforeUnload hook that will not care if operations that decide if method should be called actually finish
    if (valueOnRecord && valueOnRecord == value){
      return
    }
    
    UserData.update({
      _id: this.userId
    }, {
      $set: {
        screenSize: value
      }
    })
  },
  bountyPreference: function(valueArray) {
    UserData.update({
      _id: this.userId
    }, {
      $set: {
        bountyPreference: valueArray
      }
    })
  },
  addOthers: (currency, amount) => {
    UserData.update({
      _id: Meteor.userId()
    }, {
      $inc: {
        [`others.${currency}`]: amount
      }
    })

    Wallet.insert({
            time: new Date().getTime(),
            owner: Meteor.userId(),
            type: 'transaction',
              from: 'Blockrazor',
              message: `${currency} has been deposited to your account.`,
              amount: amount,
            read: false,
            currency: currency,
            rewardType: 'deposit'
          })
  },
  generateInviteCode: () => { // for backwards compability
    Meteor.users.find({
      inviteCode: {
        $exists: false
      }
    }).fetch().forEach(i => {
      Meteor.users.update({
        _id: i._id
      }, {
        $set: {
          inviteCode: Random.id(20)
        }
      })
    })
  },
  setReferral: (inviteCode) => {
    let invitedBy = Meteor.users.findOne({
      inviteCode: inviteCode
    })

    if (invitedBy && invitedBy._id !== Meteor.userId()) { // you can't invite yourself, duh
      Meteor.users.update({
        _id: Meteor.userId(),
        invitedBy: {
          $exists: false // can't update if user already has a referral
        }
      }, {
        $set: {
          referral: {
            invitedBy: invitedBy._id
          }
        }
      })
    }
  },
  rewardReferral: () => {
    Meteor.users.find({}).fetch().forEach(i => {
      let invited = Meteor.users.find({
        'referral.invitedBy': i._id
      }).fetch()

      if (invited.length) {
        let last24h = new Date().getTime() - 86400000 // last 24 hours

        let earnedToday = invited.reduce((i1, i2) => { // sum everything referrals have earned in the last 24hours
          let val = Wallet.find({
            rewardType: {
              $ne: 'referral'
            },
            owner: i2._id,
            time: {
              $gt: last24h
            }
          }).fetch().reduce((j1, j2) => j1 + j2.amount, 0)

          return i1 + val
        }, 0)

        creditUserWith(earnedToday * 0.05, i._id, 'inviting other users to Blockrazor.', 'referral') // reward with 5% of all
      }
    })
  },
  userStrike: (userId, type, token) => {
    if (token === 's3rv3r-only') {
      let user = UserData.findOne({
        _id: userId
      })

      if (user && !user.moderator) {
        // add a strike to user's date
        UserData.update({
          _id: user._id
        }, {
          $push: {
            strikes: {
              time: new Date().getTime(),
              type: type
            }
          }
        })

        let lastWeek = new Date().getTime() - 24*60*60*1000*7 // one week
        let strikesWeek = user.strikes ? user.strikes.reduce((i1, i2) => {
          let val = i2.time > lastWeek ? 1 : 0

          return i1 + val
        }, 0) + 1 : 0

        let lastMonth = new Date().getTime() - 24*60*60*1000*30 // one month (30 days average)
        let strikesMonth = user.strikes ? user.strikes.reduce((i1, i2) => {
          let val = i2.time > lastMonth ? 1 : 0

          return i1 + val
        }, 0) + 1 : 0

        if (strikesWeek > 3 || strikesMonth > 6) {
          Meteor.users.update({
            _id: Meteor.userId()
          }, {
            $set: {
              suspended: true
            }
          })
        }
      } else {
        throw new Meteor.Error('Error.', 'Invalid user.')
      }
    } else {
      throw new Meteor.Error('Error.', 'This method is server only.')
    }
  },
  applyForPardon: (reason) => {
    if (Meteor.userId()) {
      UserData.update({
        _id: Meteor.userId()
      }, {
        $set: {
          pardon: {
            reason: reason,
            status: 'new'
          }
        }
      })
    } else {
      throw new Meteor.Error('Error.', 'You need to be logged in.')
    }
  },
  pardonVote: function(userId, type) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('Error.', 'Please log in first')
    }

    let mod = UserData.findOne({
      _id: this.userId
    }, {
      fields: {
        moderator: true
      }
    })

    if (!mod || !mod.moderator) {
        throw new Meteor.Error('Error.', 'mod-only')
    }
      
    let u = UserData.findOne({
      _id: userId
    })

    if (!(u.pardon.votes || []).filter(i => i.userId === this.userId).length) { // user hasn't voted yet
      UserData.update({
        _id: u._id
      }, {
        $inc: {
          'pardon.score': type === 'voteUp' ? 1 : -1, // increase or decrease the current score
          [`pardon.${type === 'voteUp' ? 'upvotes' : 'downvotes'}`]: 1 // increase upvotes or downvotes
        },
        $push: {
          'pardon.votes': {
            userId: this.userId,
            type: type,
            loggedIP: this.connection.clientAddress,
            time: new Date().getTime()
          }
        }
      })
    }
         
    let approveChange = UserData.find({
      _id: u._id
    }, {
      fields: {
        pardon: 1
      } 
    }).fetch()[0]

    // pardon user if he/she receives more than 3 positive votes
    if (approveChange.pardon.score >= 3) {
      UserData.update({
        _id: u._id
      }, {
        $set: {
          pardon: {
            status: 'granted'
          }
        }
      })

      Meteor.users.update({
        _id: u._id
      }, {
        $set: {
          strikes: [], // clear his sins
          suspended: false
        }
      })

      return 'ok'
    }

    // If the user has 3 or more negative votes, deny his/her pardon request
    if (approveChange.pardon.score <= -3) {
      if (u) {
        UserData.update({
          _id: u._id
        }, {
          $set: {
            pardon: {
              status: 'denied'
            }
          }
        })
      } else {
        throw new Meteor.Error('Error.', 'Wrong id.')
      }
              
      return 'not-ok'
    }
  },
  userInputRanking: () => {
    Meteor.users.find({}).fetch().forEach(i => {
      let features = Features.find({
        createdBy: i._id
      }).fetch()

      let redflags = Redflags.find({
        createdBy: i._id
      }).fetch()

      let problems = ProblemComments.find({
        createdBy: i._id
      }).fetch()

      let summaries = Summaries.find({
        createdBy: i._id
      }).fetch()

      let all = _.union(features, redflags, problems, summaries)

      let total = 0
      let up = 0

      all.forEach(j => {
        total += j.appealNumber // total number of votes on an item
        up += (j.appealNumber + j.appeal) / 2 // total number of upvotes (10 . 6 = 8)
      })

      /*
      if (up > 10) {
        // we could add user badges here
      }
      */

      UserData.update({
        _id: i._id
      }, {
        $set: {
          inputRanking: total ? (up / total) : 0 // avoid division by zero
        }
      })
    })
  },
  initializeUser: function() {
      if (_.size(UserData.findOne({_id: this.userId})) == 0) {
        let u = UserData.find({
          'sessionData.loggedIP': this.connection.clientAddress
        }).count()
  
        let user = Meteor.users.findOne({
          _id: this.userId
        })
  
        const validate = address => {
          address = address.split('@').pop()
        
            const disposable = require('disposable-email')
            const ourList = ['mvrht.net'] // disposable emails currently not on the list
        
            return !~ourList.indexOf(address) && disposable.validate(address)
        }
        
        UserData.insert({
          _id: this.userId,
          moderator: 0,
          developer: false,
          balance: 0,
          others: {
            'USD': 0,
            'ETH': 0,
            'XMR': 0
          },
          approvedCurrencies: 0,
          createdTime: new Date().getTime(),
          sessionData: [{
            loggedIP: this.connection.clientAddress,
            headerData: this.connection.httpHeaders,
            time: new Date().getTime()
          }],
          flags: {
            duplicate: {
              createdIP: !!u,
              accessIP: false,
              disposableEmail: !validate(user.email)
            }
          }
        })
      } else {
        UserData.upsert({
          _id: this.userId
        }, {
          $push: {
            sessionData: {
              loggedIP: this.connection.clientAddress,
              headerData: this.connection.httpHeaders, // this could be a problem in the future, it's quite a big object
              time: new Date().getTime()
            }
          }
        })
      }
    },
  getUserConnectionInfo: function() {
    return this.connection;
  },
  'editProfile': function(data) {
      if (!this.userId) { throw new Meteor.Error('error', 'please log in') };

      //only update profile if data is true
      if (data) {
          //validate json objects are strings
          check(data.email, String)
          check(data.bio, String)
          check(data.username, String)

          Meteor.users.update({ _id: this.userId }, {
                  $set: {
                      email: data.email,
                      username: data.username,
                      bio: data.bio
                  }
              },
              function(error) {
                  console.log('editProfile method failed', error)
              });
      }

  },
  uploadProfilePicture: (fileName, binaryData, md5) => {
      let md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString()
      if (md5validate !== md5) {
          throw new Meteor.Error('Error.', 'Failed to validate md5 hash.')
          return false
      }
      if (!Meteor.userId()) {
          throw new Meteor.Error('Error.', 'You must be logged in to do this.');
          return false
      }

      const fs = require('fs')

      let mime = require('mime-types')
      let mimetype = mime.lookup(fileName)
      let validFile = _supportedFileTypes.includes(mimetype)
      let fileExtension = mime.extension(mimetype)
      let filename_thumbnail = `${_profilePictureUploadDirectory}${md5}_thumbnail.${fileExtension}`
      let filename = `${_profilePictureUploadDirectory}${md5}.${fileExtension}`

      let insert = false

      if (!validFile) {
          throw new Meteor.Error('Error.', 'File type not supported, png, gif and jpeg supported');
          return false
      }

      Meteor.users.update({ _id: Meteor.userId() }, {
              $set: {
                  profilePicture: {
                      small: `${md5}_thumbnail.${fileExtension}`,
                      large: `${md5}.${fileExtension}`
                  }
              }
          },
          function(error) {
              console.log('editProfile method failed', error)
          });

      fs.writeFileSync(filename, binaryData, {
          encoding: 'binary'
      }, Meteor.bindEnvironment((error) => {
          if (error) {
              log.error('Error in uploadProfilePicture', error)
          }
      }))

        var size = { width: 200, height: 200 };
gm(filename)
    .resize(size.width, size.height + ">")
    .gravity('Center')
    .write(filename_thumbnail, function(error) {
        if (error) console.log('Error - ', error);
    });

  },
});

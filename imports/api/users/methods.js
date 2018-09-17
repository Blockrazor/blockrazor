import { Meteor } from 'meteor/meteor'
import {  ProfileImages, UserData, Wallet, ProblemComments, Features, Redflags, Summaries } from '/imports/api/indexDB.js'
import { check } from 'meteor/check'
import { creditUserWith } from '/imports/api/utilities.js'

import speakeasy from 'speakeasy'

Meteor.methods({
  signedUpLastMonth: () => {
  	return Meteor.users.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30) /* 30 days */).length
  },
    commentsLastMonth: () => {
        // includes all added features (and feature comments), redflags (and redflag comments), summaries and problem comments
        let features = Features.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30))
        let redflags = Redflags.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30))
        let summaries = Summaries.find({}).fetch().filter(i => new Date(i.createdAt) > (new Date().getTime() - 1000*60*60*24*30))
        let problemComments = ProblemComments.find({}).fetch().filter(i => new Date(i.date) > (new Date().getTime() - 1000*60*60*24*30))
        
        return features.length + redflags.length + summaries.length + problemComments.length
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
  // needs to be removed before launch
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
  userStrike: (userId, type, token, times) => {
    times = times || 1
    if (token === 's3rv3r-only') {
      let user = UserData.findOne({
        _id: userId
      })

      if (user) {
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
        }, 0) + times : times

        let lastMonth = new Date().getTime() - 24*60*60*1000*30 // one month (30 days average)
        let strikesMonth = user.strikes ? user.strikes.reduce((i1, i2) => {
          let val = i2.time > lastMonth ? 1 : 0

          return i1 + val
        }, 0) + times : times

        if (strikesWeek > 3 || strikesMonth > 6) {
          Meteor.users.update({
            _id: userId
          }, {
            $set: {
              suspended: true
            }
          })
        }
      } else {
        throw new Meteor.Error('Error.', 'messages.users.invalid')
      }
    } else {
      throw new Meteor.Error('Error.', 'messages.server_only')
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
      throw new Meteor.Error('Error.', 'messages.login')
    }
  },
  pardonVote: function(userId, type) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('Error.', 'messages.login')
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
        throw new Meteor.Error('Error.', 'messages.users.wrong_id')
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
  verify2fa: function(token) {
    check(token, String)

    let user = Meteor.users.findOne({
      _id: this.userId
    })

    if (user) {
      if (user.enabled2fa) {
        let verified = speakeasy.totp.verify({
          secret: user.secret2fa,
          encoding: 'base32',
          token: token
        })

        if (verified) {
          Meteor.users.update({
            _id: this.userId,
          }, {
            $set: {
              pass2fa: true
            }
          })

          return true
        } else {
          if (~(user.backup2fa || []).indexOf(token)) {
            let backup2fa = user.backup2fa

            backup2fa = backup2fa.filter(i => i !== token)
            backup2fa.push(('0000000' + Math.floor(Math.random() * 100000000)).slice(-8)) // reset the code

            Meteor.users.update({
              _id: this.userId,
            }, {
              $set: {
                pass2fa: true,
                backup2fa: backup2fa
              }
            })

            return true
          }

          throw new Meteor.Error('messages.users.invalid_token')
        }
      }
    }
  },
  regenerateBackup2fa: function() {
    let codes = [...Array(10).keys()].map(i => ('0000000' + Math.floor(Math.random() * 100000000)).slice(-8))

    Meteor.users.update({
      _id: Meteor.userId()
    }, {
      $set: {
        'backup2fa': codes
      }
    })
  },
  end2faSession: function() {
    Meteor.users.update({
      _id: this.userId,
    }, {
      $set: {
        pass2fa: false
      }
    })
  },
  'editProfile': function(data) {
      if (!this.userId) { throw new Meteor.Error('error', 'messages.login') };

      //only update profile if data is true
      if (data) {
          //validate json objects are strings
          check(data.email, String)
          check(data.bio, String)
          check(data.username, String)
          check(data.secret, Match.Maybe(String))
          check(data.userToken, Match.Maybe(String))
          check(data.status2fa, Boolean)

          let user = Meteor.users.findOne({
            _id: this.userId
          })

          let verified = false

          if (data.status2fa && !user.enabled2fa) {
            verified = speakeasy.totp.verify({
              secret: data.secret,
              encoding: 'base32',
              token: data.userToken
            })

            if (!verified) {
              throw new Meteor.Error('messages.users.error_2fa')
            }
          } else if (!data.status2fa && user.enabled2fa) {
            verified = speakeasy.totp.verify({
              secret: user.secret2fa,
              encoding: 'base32',
              token: data.userToken
            })

            verified = verified || ~(user.backup2fa || []).indexOf(data.userToken)

            if (!verified) {
              throw new Meteor.Error('messages.users.error_2fa')
            }
          }

          let set = {
            email: data.email,
            username: data.username,
            bio: data.bio
          }

          if (verified) {
            set = _.extend(set, {
              secret2fa: data.status2fa ? data.secret : '',
              enabled2fa: data.status2fa,
              pass2fa: true,
              backup2fa: data.status2fa ? [...Array(10).keys()].map(i => ('0000000' + Math.floor(Math.random() * 100000000)).slice(-8)) : []
            })
          }

          Meteor.users.update({ _id: this.userId }, {
            $set: set
          }, function(error) {
            console.log('editProfile method failed', error)
          })
      }
  },
  uploadProfilePicture: (fileName, binaryData, md5) => {
      let md5validate = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binaryData)).toString()
      if (md5validate !== md5) {
          throw new Meteor.Error('Error.', 'messages.users.invalid_md5')
          return false
      }
      if (!Meteor.userId()) {
          throw new Meteor.Error('Error.', 'messages.login');
          return false
      }

      const fs = require('fs')

      let mime = require('/imports/api/miscellaneous/mime').default
      let mimetype = mime.lookup(fileName)
      let validFile = _supportedFileTypes.includes(mimetype)
      let fileExtension = mime.extension(mimetype)
      let filename_thumbnail = `${_profilePictureUploadDirectory}${md5}_thumbnail.${fileExtension}`
      let filename = `${_profilePictureUploadDirectory}${md5}.${fileExtension}`

      let insert = false

      if (!validFile) {
          throw new Meteor.Error('Error.', 'messages.users.invalid_file');
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
  possibleModerators: () => {
    let possible = []
    Meteor.users.find({}).fetch().forEach(i => {
      let u = UserData.findOne({
        _id: i._id
      })

      if (u) {
        let flags = []
        Object.keys(u.flags || {}).forEach(i => {
          if (typeof u.flags[i] === 'object') {
            Object.keys(u.flags[i]).forEach(j => {
              if (u.flags[i][j]) {
                flags.push(`${i}.${j}`)
              }
            })
          }
        })

        let strikes = (u.strikes || []).filter(i => i.time > (new Date().getTime() - 1000*60*60*24*30))

        if (!i.suspended && !u.moderator && flags.every(i => !i.startsWith('duplicate.')) && strikes.length === 0 && !(u.mod || {}).denied) { // three requirements, user is not a moderator, he has no duplicate flags and he has no strikes in the last 30 days
          let features = Features.find({
            createdBy: u._id
          }).count()
          let redflags = Redflags.find({
            createdBy: u._id
          }).count()
          let summaries = Summaries.find({
            createdBy: u._id
          }).count()

          let wallet = Wallet.find({
            owner: u._id
          }).fetch()

          wallet = wallet.filter(i => {
            return ~['anwserQuestion', 'newCurrency', 'hashReward'].indexOf(i.rewardType)
          })

          possible.push({
            _id: u._id,
            inputRanking: u.inputRanking,
            totalInput: features + redflags + summaries,
            totalBounties: wallet.length,
          })
        }
      }
    })

    let maxTotalInput = possible.reduce((i1, i2) => i2.totalInput > i1 ? i2.totalInput : i1, 0) || 1
    let maxTotalBounties = possible.reduce((i1, i2) => i2.totalBounties > i1 ? iw.totalBounties : i1, 0) || 1

    possible = possible.map(i => _.extend(i, {
      rating: (i.inputRanking + (i.totalInput / maxTotalInput) + (i.totalBounties / maxTotalBounties)) / 3
    })).sort((i1, i2) => {
      return i2.rating - i1.rating
    })

    possible.forEach((i, ind) => {
      UserData.update({
        _id: i._id
      }, {
        $set: {
          'mod.data': _.extend(_.omit(i, '_id'), {
            rank: ind + 1
          })
        }
      })
    }) // save data for all possible moderators

    possible = possible.slice(0, Math.ceil(possible.length * 0.3))

    UserData.update({
      'mod.candidate': true
    }, {
      $set: {
        'mod.candidate': false
      }
    }) // reset all flags before

    possible.forEach(i => { // set the flag for all candidates
      UserData.update({
        _id: i._id
      }, {
        $set: {
          'mod.candidate': true
        }
      })
    })
  },
  modCandidateVote: function(id, type) {
    if (!Meteor.userId()) {
      throw new Meteor.Error('Error.', 'messages.login')
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
        
    let user = UserData.findOne({
      _id: id
    })

    if (!((user.mod.votes || {}).votes || []).filter(i => i.userId === this.userId).length) { // user hasn't voted yet
      let ip = '0.0.0.0'

      if (Meteor.isServer) {
        ip = this.connection.clientAddress
      }

      UserData.update({
        _id: user._id
      }, {
        $inc: {
          'mod.votes.score': type === 'voteUp' ? 1 : -1, // increase or decrease the current score
          [type === 'voteUp' ? 'mod.votes.upvotes' : 'mod.votes.downvotes']: 1 // increase upvotes or downvotes
        },
        $push: {
          'mod.votes.votes': {
            userId: this.userId,
            type: type,
            loggedIP: ip,
            time: new Date().getTime()
          }
        }
      })
    }
           
    let approveChange = UserData.find({
      _id: user._id
    }, {
      fields: {
        mod: 1
      } 
    }).fetch()[0]

    if (approveChange.mod.votes.score >= 3) {
      UserData.update({
        _id: user._id
      }, {
        $set: {
          'mod.approved': true,
          'mod.time': new Date().getTime(),
          moderator: true
        }
      })

      return 'ok'
    }

    if (approveChange.mod.votes.score <= -3) {
      UserData.update({
        _id: user._id
      }, {
        $set: {
          'mod.denied': true,
          'mod.time': new Date().getTime()
        }
      })

      return 'not-ok'
    }
  }
});

if (Meteor.isDevelopment) {
    Meteor.methods({
        generateTestUser: () => {
            Accounts.createUser({
                username: 'testing',
                password: 'testing',
                email: 'testing@testing.test'
            })
        }
    })
}
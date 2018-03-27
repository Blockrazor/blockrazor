import { check } from 'meteor/check'
import { ProfileImages, UserData, Wallet } from '/imports/api/indexDB.js'
import { creditUserWith } from '/imports/api/utilities.js'

Meteor.methods({
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
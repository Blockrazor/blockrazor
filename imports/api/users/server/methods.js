import { check } from 'meteor/check'
import { ProfileImages, UserData } from '/imports/api/indexDB.js'


Meteor.methods({
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
            check(data.profilePicture, String)

            Meteor.users.update({ _id: this.userId }, {
                    $set: {
                        email: data.email,
                        username: data.username,
                        bio: data.bio,
                        profilePicture: data.profilePicture
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

        try {
            insert = ProfileImages.insert({
                _id: md5,
                createdAt: new Date().getTime(),
                createdBy: Meteor.userId(),
                extension: fileExtension
            })
        } catch(error) {
            throw new Meteor.Error('Error.', 'That image has already been used on Blockrazor, please choose another profile image.');
        }

        if (insert !== md5) {
            throw new Meteor.Error('Error.', 'Something is wrong, please contact help.')
        }

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
import { check } from 'meteor/check'
import { ProfileImages } from '../../lib/database/ProfileImages'

//The Meteor.user() object does not publish email by default
Meteor.publish('_extendUser', function() {
    return Meteor.users.find({ _id: this.userId }, { fields: { email: 1, bio: 1, profilePicture: 1 } });
});

Meteor.methods({
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
    },
});
import { Template } from 'meteor/templating';
import { ProfileImages } from '/imports/api/indexDB.js'

import './editProfile.html'

Template.editProfile.events({
    'submit #editProfile': (e) => {
        e.preventDefault();

        var email = e.target.email.value;
        var username = e.target.username.value;
        var bio = e.target.bio.value

        var data = {
            email: email,
            bio: bio,
            username: username,
        }

        Meteor.call('editProfile', data, (err, data) => {
            if (err) {
                console.log('error editing profile', err)
            } else {
                FlowRouter.go('/profile');
            }
        })
    },
    'click #image': (event, templateInstance) => {
        event.preventDefault()

        $('#imageInput').click()
    },
    'change #imageInput': (event, templateInstance) => {
        const mime = require('mime-types')

        let file = event.target.files[0]
        let uploadError = false
        let mimetype = mime.lookup(file)
        let fileExtension = mime.extension(file.type)

        if (file.size > _profilePictureFileSizeLimit) {
            sAlert.error('Image is too big.')
            uploadError = true
        }

        if (!_supportedFileTypes.includes(file.type)) {
            sAlert.error('File must be an image.')
            uploadError = true
        }

        if(file){
        $('#uploadLabel').removeClass('btn-success');
        $('#uploadLabel').addClass('btn-primary');
        $("button").attr("disabled", "disabled"); //disable all buttons
        $(".uploadText").html("<i class='fa fa-circle-o-notch fa-spin'></i> Uploading"); //show upload progress


        //Only upload if above validation are true
        if (!uploadError) {
            let reader = new FileReader()
            reader.onload = fEvent => {
                let binary = reader.result
                let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()
                
                Meteor.call('uploadProfilePicture', file.name, reader.result, md5, (error, result) => {
                                        if (error) {
                        sAlert.error(error.message);
                        $('#uploadLabel').removeClass('btn-success');
                        $('#uploadLabel').addClass('btn-primary');
                        $(".uploadText").html("Upload");
                    } else {                        
                        $('#js-image').val(`${md5}.${fileExtension}`)
                    $("button").attr("disabled", false); //enable all buttons
                    $('#uploadLabel').addClass('btn-success');
                    $(".uploadText").html("Change"); //update button text now upload is complete
                    $('#profilePicture').attr('src', `${_profilePictureUploadDirectoryPublic}${md5}_thumbnail.${fileExtension}`)

                    }
                })
           }
           reader.readAsBinaryString(file)
        }
    }
    }
});

Template.editProfile.helpers({
    user: () => {
        return Meteor.user();
    },
    ProfileImages: () => {
        return ProfileImages.findOne({createdBy:Meteor.userId()});
    },



});
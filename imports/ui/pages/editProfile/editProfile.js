import { Template } from 'meteor/templating';
import { ProfileImages } from '/imports/api/indexDB.js'
import('sweetalert2').then(swal => window.swal = swal.default)
import('qrcode').then(qr => window.QRCode = qr.default)
import('speakeasy').then(speakeasy => window.speakeasy = speakeasy.default)

import './editProfile.html'

Template.editProfile.events({
    'submit #editProfile': (e, templateInstance) => {
        e.preventDefault()

        var email = e.target.email.value;
        var username = e.target.username.value;
        var bio = e.target.bio.value

        var data = {
            email: email,
            bio: bio,
            username: username,
            secret: window.secret ? window.secret.base32 : '',
            userToken: $('#2facode').val(),
            status2fa: $('#2fa').is(':checked')
        }

        Meteor.call('editProfile', data, (err, data) => {
            if (err) {
                console.log('error editing profile', err)
                sAlert.error(TAPi18n.__(err.reason)) // this needs better error handling
            } else {
                //route to your profile page not the /profile page
                // FlowRouter.go('/profile/'+Meteor.user().slug);

                templateInstance.enable2fa.set(false)
                templateInstance.disable2fa.set(false)

                //give the user a better UX and let them know its been saved!
                swal({
                    icon: "success",
                    text: TAPi18n.__('user.edit.updated'),
                    confirmButtonClass: 'btn btn-primary'
                  });

//send an event to segment
        let payload = {
            event: 'Succesfully edited their profile',
        }

        segmentEvent(payload);
            }
        })
    },
    'click #js-backup2fa': (event, templateInstance) => {
        event.preventDefault()

        templateInstance.show2fa.set(!templateInstance.show2fa.get())
    },
    'click #js-regen': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('regenerateBackup2fa', (err, data) => {})
    },
    'change #2fa': (event, templateInstance) => {
        event.preventDefault()

        let status = $(event.currentTarget).is(':checked')
        let user = Meteor.users.findOne({
            _id: Meteor.userId()
        })

        if (status && !user.enabled2fa) {
            window.secret = speakeasy.generateSecret({
                name: 'Blockrazor',
                issuer: 'Blockrazor.org'
            })

            QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
                templateInstance.qrcode.set(data_url)  
            })

            templateInstance.enable2fa.set(true)
        } else if (!status && user.enabled2fa) {
            templateInstance.disable2fa.set(true)
        } else {
            templateInstance.disable2fa.set(false)
            templateInstance.enable2fa.set(false)
        }
    },

    'click #image': (event, templateInstance) => {
        event.preventDefault()

        $('#imageInput').click()
    },
    'change #imageInput': (event, templateInstance) => {
        let file = event.target.files[0]
        let uploadError = false
        let mimetype = mime.lookup(file)
        let fileExtension = mime.extension(file.type)

        if (file.size > _profilePictureFileSizeLimit) {
            sAlert.error(TAPi18n.__('user.edit.too_big'))
            uploadError = true
        }

        if (!_supportedFileTypes.includes(file.type)) {
            sAlert.error(TAPi18n.__('user.edit.must_be_image'))
            uploadError = true
        }

        if(file){
        $('#uploadLabel').removeClass('btn-success');
        $('#uploadLabel').addClass('btn-primary');
        $("button").attr("disabled", "disabled"); //disable all buttons
        $(".uploadText").html(`<i class='fa fa-circle-o-notch fa-spin'></i> ${TAPi18n.__('user.edit.uploading')}`); //show upload progress


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
                        $(".uploadText").html(TAPi18n.__('user.edit.upload'));
                    } else {                        
                    $('#js-image').val(`${md5}.${fileExtension}`)
                    $("button").attr("disabled", false); //enable all buttons
                    $('#uploadLabel').addClass('btn-success');
                    $(".uploadText").html(TAPi18n.__('user.edit.change')); //update button text now upload is complete
                    $('#profilePicture').attr('src', `${_profilePictureUploadDirectoryPublic}${md5}_thumbnail.${fileExtension}`)

                    //send an event to segment
        let payload = {
            event: 'Changed their profile picture',
        }

        segmentEvent(payload);

                    }
                })
           }
           reader.readAsBinaryString(file)
        }
    }
    }
})

Template.editProfile.onCreated(function() {
    this.enable2fa = new ReactiveVar(false)
    this.disable2fa = new ReactiveVar(false)
    this.show2fa = new ReactiveVar(false)
    this.qrcode = new ReactiveVar('')
})

Template.editProfile.helpers({
    user: () => {
        return Meteor.users.findOne({
            _id: Meteor.userId()
        });
    },
    show2fa: () => Template.instance().show2fa.get(),
    ProfileImages: () => {
        return ProfileImages.findOne({createdBy:Meteor.userId()});
    },
    enable2fa: () => Template.instance().enable2fa.get(),
    disable2fa: () => Template.instance().disable2fa.get(),
    qrcode: () => Template.instance().qrcode.get()
});
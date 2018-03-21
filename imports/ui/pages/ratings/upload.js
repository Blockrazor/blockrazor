import { Template } from 'meteor/templating';
import { WalletImages, devValidationEnabled } from '/imports/api/indexDB.js';

import './upload.html'

Template.upload.helpers({
  walletImageError() {
      return Session.get('walletImageError');
  },
  walletImageSuccess() {
      return Session.get('walletImageSuccess');
  },
  uploadedCount(id, imageOf) {

      var walletUploadCount = WalletImages.find({ currencyId: id, imageOf: imageOf, createdBy: Meteor.userId() }).count();

      if (walletUploadCount) {
          $('.file_' + imageOf + '_' + id).html('Change');
          $('#label_' + imageOf + '_' + id).removeClass('btn-primary');
          $('#label_' + imageOf + '_' + id).addClass('btn-success');
          return true;

      } else {
          $('#label_' + imageOf + '_' + id).addClass('btn-primary');
          $('#label_' + imageOf + '_' + id).removeClass('btn-success');
          return false;
      }

  },
  getWalletImageURL(id, imageOf) {
      var walletImageURL = WalletImages.findOne({ currencyId: id, imageOf: imageOf, createdBy: Meteor.userId() }, { fields: { _id: 1, extension: 1 } });
      if (walletImageURL) {
          return _walletUpoadDirectoryPublic + walletImageURL._id + '.' + walletImageURL.extension;
      } else {
          return false;
      }
  }
});

Template.upload.events({
'change input': function(event) {
                  var instance = this;
              var file = event.target.files[0];
              var uploadError = false;
              var uploadType = event.target.id.substring(0, event.target.id.lastIndexOf("_"));
              var fileID = event.target.id.substring(event.target.id.lastIndexOf("_") + 1);

              Session.set('walletImageError', false);
              Session.set('walletImageSuccess', false);

              if (file) {

                  //add spinner if uploading
                  var sel = event.currentTarget.id.replace(/\s/g, '');
                  $(".file_" + sel).html("<i class='fa fa-circle-o-notch fa-spin'></i> Uploading");

                  //check if filesize of image exceeds the global limit
                  if (file.size > _walletFileSizeLimit) {
                      Session.set('walletImageError', 'Image must be under 2mb');
                      uploadError = true;
                  }

                  if (!_supportedFileTypes.includes(file.type)) {
                      Session.set('walletImageError', 'File must be an image');
                      uploadError = true;
                  }

                  //Only upload if above validation are true
                  if (!uploadError || !devValidationEnabled) {
                      var reader = new FileReader();
                      reader.onload = function(fileLoadEvent) {

                          var binary = reader.result;
                          var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();

                          //check if an image has already been uploaded 
                          var walletImageExist = WalletImages.find({ currencyId: instance._id, imageOf: uploadType, createdBy: Meteor.userId() }).count();
                          
                          //if existing wallet images exist, lets delete them and the images on the server
                          if (walletImageExist) {
                              Meteor.call('deleteWalletImage', uploadType, instance._id, function(error, result) {
                                      if (error) {
                                          console.log(error)
                                      }
                                  });
                              }

                              Meteor.call('uploadWalletImage', file.name, uploadType, instance._id, reader.result, md5, function(error, result) {
                                  if (error) {
                                      console.log(error)
                                      Session.set('walletImageError', error.message);
                                      $(".file_" + sel).html("Upload");
                                  } else {

                                      Session.set('walletImageSuccess', 'Success');

                                      //revert to upload text as progress has ended bad or good 

                                      $(".file_" + sel).html("Change");
                                      $("#label_" + sel).removeClass('btn-primary');
                                      $("#label_" + sel).addClass('btn-success');
                                      $(event.currentTarget.id).val('');
                                  }

                              });
                          }
                          reader.readAsBinaryString(file);
                      }
                  }
              }
          });

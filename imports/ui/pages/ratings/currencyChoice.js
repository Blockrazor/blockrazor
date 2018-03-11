import { Template } from 'meteor/templating';
import { WalletImages } from '/imports/api/indexDB.js';

import './currencyChoice.html'


Template.currencyChoice.onRendered(function () {
  var instance = this;
  Session.set('walletImageError',false);
  Session.set('walletImageSuccess',false);
  // $("#toggle" + instance.data._id).click(function(){
  //   $("#upload" + instance.data._id).toggle()
  // });
});

Template.currencyChoice.helpers({
  uploadedCount(id) {

      var walletUploadCount = WalletImages.find({ currencyId: id, createdBy: Meteor.userId() }).count();
      if (walletUploadCount == 1) {
          return '<span class="badge badge-pill badge-warning">1/3</span>';
      }else if(walletUploadCount == 2){
        return '<span class="badge badge-pill badge-warning">2/3</span>';
      }else if (walletUploadCount == 3){
        return '<span class="badge badge-pill badge-success"><i class="fa fa-check" aria-hidden="true"></i></span>';
      }

  }
});
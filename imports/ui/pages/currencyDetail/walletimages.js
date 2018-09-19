import { Template } from 'meteor/templating'
import { WalletImages } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './walletimages.html'

Template.walletimages.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('walletImagesSlug', FlowRouter.getParam('slug'))
  });
});

Template.walletimages.helpers({
  walletimages: function () {
    return WalletImages.find({currencySlug: FlowRouter.getParam('slug')});
  }
});
Template.walletImage.helpers({
  walletimagesdir(){
    return _walletUpoadDirectoryPublic;
  }
});

Template.walletimages.events({
  'error  img': function(e) {
    // fires when a particular image doesn't exist in given path
    if ($(e.target).attr('src') !== '/codebase_images/noimage.png') {
      $(e.target).attr('src', '/codebase_images/noimage.png')
    }
  },
  'click .walletImageOpen': (event, templateInstance) => {

    $('#img_'+ event.currentTarget.id).modal('show');
  }
});

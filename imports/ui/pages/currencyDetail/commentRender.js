import { Template } from 'meteor/templating'
import { Features } from '/imports/api/indexDB.js'

import './commentRender.html'

Template.commentRender.helpers({
  
})

Template.commentRender.events({
'error .comment-author img': function(e) {
  // fires when a particular image doesn't exist in given path
  if ($(e.target).attr('src') !== '/codebase_images/noprofile.png') {
    $(e.target).attr('src', '/codebase_images/noprofile.png')
  }
},
'click .flag': function() {
  $('#flagModal-' + this._id).modal('show');
},
'click .commentFlag': function() {
  $('#flagModal-' + this._id).modal('hide');
  Meteor.call('flag', this._id, function(error, resonse) {
    if(!error){
      sAlert.success(TAPi18n.__('currenct.comment.thanks'));
    } else {
      sAlert.error(TAPi18n.__(error.reason));
    }
  });
}

});

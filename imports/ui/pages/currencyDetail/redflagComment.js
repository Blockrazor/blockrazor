import { Template } from 'meteor/templating'
import { Redflags } from '/imports/api/indexDB.js'

import './redflagComment.html'

Template.redflagComment.helpers({
  alreadyVotedOnComment: function(id) {
      if (_.include(Redflags.findOne({_id: id}).appealVoted, Meteor.userId())) {
          return true;
      }
  },
})


Template.redflagComment.events({
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
    Meteor.call('redflag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success(TAPi18n.__('currency.feature.thanks'));
      } else {
        sAlert.error(TAPi18n.__(error.reason));
      }
    });
  }

});

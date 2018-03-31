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
  'click .flag': function() {
    $('#flagModal-' + this._id).modal('show');
  },
  'click .commentFlag': function() {
    $('#flagModal-' + this._id).modal('hide');
    Meteor.call('redflag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success("Thanks for letting us know!");
      } else {
        sAlert.error(error.reason);
      }
    });
  }

});

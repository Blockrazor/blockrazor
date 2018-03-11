import { Template } from 'meteor/templating'
import { Features } from '/imports/api/indexDB.js'

import './comment.html'

Template.comment.helpers({
  alreadyVotedOnComment: function(id) {
      if (_.include(Features.findOne({parentId: id}).appealVoted, Meteor.userId())) {
          return true;
      }
  },
})

Template.comment.events({
'click .flag': function() {
$('#flagModal-' + this._id).modal('show');

},
'click .commentFlag': function() {
  $('#flagModal-' + this._id).modal('hide');
  Meteor.call('flag', this._id, function(error, resonse) {
    if(!error){
      sAlert.success("Thanks for letting us know!");
    } else {
      sAlert.error(error.reason);
    }
  });
}

});
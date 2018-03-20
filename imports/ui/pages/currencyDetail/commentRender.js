import { Template } from 'meteor/templating'
import { Features } from '/imports/api/indexDB.js'

import './commentRender.html'

Template.commentRender.helpers({
  alreadyVotedOnComment: function(id) {
      if (_.include(Features.findOne({_id: id}).appealVoted, Meteor.userId())) {
          return true;
      }
  },
})

Template.commentRender.events({
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

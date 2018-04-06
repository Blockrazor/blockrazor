import { Template } from 'meteor/templating';
import './approveCommunityImage.html'

Template.approveCommunityImage.events({
  'click #reject': function(event) {
    Meteor.call('flagCommunityImage', this._id, (err, data) => {
      if (!err) {
        sAlert.success('Rejected.')
      } else {
        sAlert.error(err.reason)
      }
    })
  },
  'click #approve': function(event) {
    Meteor.call('approveCommunityImage', this._id, (err, data) => {
      if (!err) {
        sAlert.success('Approved.')
      } else {
        sAlert.error(err.reason)
      }
    })
  }
})

Template.approveCommunityImage.helpers({
  _communityUploadDirectoryPublic(){
    return _communityUploadDirectoryPublic
  },
  display: function() {
    return !this.approved ? 'flex' : 'none' 
  }
})

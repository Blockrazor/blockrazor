import { Template } from 'meteor/templating';
import './approveWalletImage.html'

Template.approveWalletImage.events({
  'click #reject': function(event) {
    Meteor.call('flagWalletImage', this._id, (err, data) => {
      if (!err) {
        sAlert.success('Rejected.')
      } else {
        sAlert.error(err.reason)
      }
    })
  },
  'click #approve': function(event) {
    Meteor.call('approveWalletImage', this._id, (err, data) => {
      if (!err) {
        sAlert.success('Approved.')
      } else {
        sAlert.error(err.reason)
      }
    })
  }
})

Template.approveWalletImage.helpers({
  display: function() {
    return !this.approved ? 'flex' : 'none' 
  }
})

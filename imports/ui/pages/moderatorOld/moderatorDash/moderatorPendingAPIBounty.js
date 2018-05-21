import { Template } from 'meteor/templating'
import './moderatorPendingAPIBounty.html'

Template.moderatorPendingAPIBounty.events({
  'click #approve': function(data) {
    data.preventDefault();
    Meteor.call('approveAPIbounty', this._id);
  },
  'click #reject': function(data) {
    data.preventDefault();
    var reason = $('#reason').val();
    Meteor.call('rejectBounty', this._id, reason);
    // Meteor.call('setRejected', this._id, true);
    // Session.set('currentlyRejecting', this._id);
    // Session.set('reject', true);
    // Session.set('submittername', this.username);
    // Session.set('owner', this.owner);
    // Session.set('currencyName', this.currencyName);
  }
});

import { Template } from 'meteor/templating';
import './approveWalletImage.html'

Template.approveWalletImage.events({
  'click #reject': function(event){
    Meteor.call('flagWalletImage', this._id);
    console.log(this._id);
  },
  'click #approve': function(event){
    Meteor.call('approveWalletImage', this._id);
  }
});

Template.approveWalletImage.helpers({
  display() {
    if(_.include(this.flaglikers, Meteor.userId())) {
      return "none";
    } else {return "flex"}
  }
})

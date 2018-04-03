import { Template } from 'meteor/templating';
import './approveCommunityImage.html'

Template.approveCommunityImage.events({
  'click #reject': function(event){
    Meteor.call('flagWalletImage', this._id);
    console.log(this._id);
  },
  'click #approve': function(event){
    Meteor.call('approveCommunityImage', this._id);
  }
});

Template.approveCommunityImage.helpers({
  _communityUploadDirectoryPublic(){
    return _communityUploadDirectoryPublic
  },
  display() {
    if(_.include(this.flaglikers, Meteor.userId())) {
      return "none";
    } else {return "flex"}
  }
})

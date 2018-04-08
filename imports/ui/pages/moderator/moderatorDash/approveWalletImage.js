import { Template } from 'meteor/templating';
import './approveWalletImage.html'

Template.approveWalletImage.events({
'click .image': function(event) {

        //open modal
        $('.imageModal').modal('show');

        //get large image filename
        let largeImage = event.target.src.replace('_thumbnail', '');
        $(".imageModalSrc").attr("src", largeImage);

    },
  'click #reject': function(event){
    Meteor.call('', this._id);

       swal({
  title: "Are you sure?",
  icon: "warning",
  buttons: true,
  dangerMode: true,
})
.then((willDelete) => {
  if (willDelete) {
    Meteor.call('flagWalletImage', this._id);

  }
});
  },
  'click #approve': function(event){
    swal({
  title: "Are you sure?",
  icon: "warning",
  buttons: true,
  dangerMode: true,
})
.then((willDelete) => {
  if (willDelete) {
    Meteor.call('approveWalletImage', this._id);

  }
});

  }
})

Template.approveWalletImage.helpers({
  display: function() {
    return !this.approved ? 'flex' : 'none' 
  }
})

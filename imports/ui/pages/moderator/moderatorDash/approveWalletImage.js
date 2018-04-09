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
          swal("Why are you rejecting this?", {
              content: "input",
              button: { className: 'btn btn-primary' },
              showCancelButton: true,
              attributes: {
                  type: "text",
                  required: true,
              }
          })
          .then((rejectionReason) => {

              if (rejectionReason) {
                  Meteor.call('flagWalletImage', this._id, rejectionReason, (err, data) => {
                      if (!err) {
                          sAlert.success('Rejected.')
                      } else {
                          sAlert.error(err.reason)
                      }
                  })
              }else{
                sAlert.error('No rejection reason supplied, image not rejected')
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

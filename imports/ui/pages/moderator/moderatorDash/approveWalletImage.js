import { Template } from 'meteor/templating';
import './approveWalletImage.html'
import('sweetalert2').then(swal => window.swal = swal.default)

Template.approveWalletImage.events({
'click .image': function(event) {

        //open modal
        $('.imageModal').modal('show');

        //get large image filename
        let largeImage = event.target.src.replace('_thumbnail', '');
        $(".imageModalSrc").attr("src", largeImage);

    },
  'click #reject': function(event){
          swal({
              text: TAPi18n.__('moderator.dash.why'),
              type: "warning",
              input: "text",
              confirmButtonClass: 'btn btn-primary',
              cancelButtonClass: 'btn',
              showCancelButton: true
          })
          .then((rejectionReason) => {

              if (rejectionReason) {
                  Meteor.call('flagWalletImage', this._id, rejectionReason, (err, data) => {
                      if (!err) {
                          sAlert.success(TAPi18n.__('moderator.dash.rejected'))
                      } else {
                          sAlert.error(TAPi18n.__(err.reason))
                      }
                  })
                  Session.set('lastApproval', 'approveWalletImage');
              }else{
                sAlert.error(TAPi18n.__('moderator.dash.no_reason'))
              }
          });

  },
  'click #approve': function(event){
    swal({
      title: TAPi18n.__('moderator.dash.sure'),
      icon: "warning",
      buttons: true,
      dangerMode: true,
    })
    .then((willDelete) => {
      if (willDelete) {
        Meteor.call('approveWalletImage', this._id);
      }
      Session.set('lastApproval', 'approveWalletImage');
    });
  }
})

Template.approveWalletImage.helpers({
  display: function() {
    return !this.approved ? 'flex' : 'none' 
  }
})

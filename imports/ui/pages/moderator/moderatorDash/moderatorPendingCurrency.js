import { Template } from 'meteor/templating'
import './moderatorPendingCurrency.html'
import('sweetalert2').then(swal => window.swal = swal.default)

Template.moderatorPendingCurrency.onCreated(function() {

  // a way to get parent's template instance
  let view = this.view

  while (view) {
    if (view.name === 'Template.moderatorDash') {
      break
    }
    view = view.parentView
  }

  this.parent = view.templateInstance()
})

Template.moderatorPendingCurrency.onRendered(function (){
  this.parent.reject.set(false);
});

Template.moderatorPendingCurrency.events({
    'click #approve': function(data) {
        data.preventDefault();

        Meteor.call('approveCurrency', this._id, (err, data) => {

            if (err) {
                swal({
                    icon: "error",
                    text: err.error,
                    confirmButtonClass: 'btn btn-primary'
                });
            }
            Session.set('lastApproval', 'moderatorPendingCurrency');
        })
    },
    'click #reject': function(data, templateInstance) {
        data.preventDefault();
        Meteor.call('setRejected', this._id, true);
        templateInstance.parent.currentlyRejecting.set(this._id)
        templateInstance.parent.reject.set(true)
        templateInstance.parent.submittername.set(this.username)
        templateInstance.parent.owner.set(this.owner)
        templateInstance.parent.currencyName.set(this.currencyName)

        Session.set('lastApproval', 'moderatorPendingCurrency');
    }
});
Template.moderatorPendingCurrency.helpers({
  display () {
    if(this.rejected) {
      return TAPi18n.__('moderator.dash.currency.none');
    }},
  finalValue () {
    if (this.maxCoins && this.marketCap) {
    return Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } else {
    return TAPi18n.__('moderator.dash.currency.calculating')
  }
  },
  marketCap () {
    return Math.round(this.marketCap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  circulating () {
    return Math.round(this.circulating).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  launchDate () {
    if (this.genesisTimestamp) {
    return TAPi18n.__('moderator.dash.currency.launched') + ' ' + moment(this.genesisTimestamp).fromNow();
  } else {
    return "";
  }
  },
  link () {
    if (this.genesisTimestamp) {
    return "#";
  } else {
    return "/currency/" + this._id + "?edit=launchdate";
  }
  },
  linktext () {
    if (this.genesisTimestamp) {
      return "";
    } else {
      return TAPi18n.__('moderator.dash.currency.add') + this.currencyName + TAPi18n.__('moderator.dash.currency.launch_date')
    }
  },
});



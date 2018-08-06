import './layout.html'

Template.layout.helpers({
    breadcrumbs: () => {
        return Session.get('breadcrumbs') || ""
    }
})

Template.layout.events({
  'click .filterComponent': function (event) {
    $('.currencyFilterModal').modal('show');
  }
 });
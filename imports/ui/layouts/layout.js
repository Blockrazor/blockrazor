import './layout.html'

Template.layout.helpers({
    breadcrumbs: () => {
        let bc = Session.get('breadcrumbs') || {}

        let crumbs = bc.text.split('/')
        bc.urls = bc.urls || []
        bc.urls.push(FlowRouter.current().path)

        return crumbs.map((i, ind) => ({
        	text: TAPi18n.__(`breadcrumbs.${i.trim()}`),
        	url: bc.urls[ind],
        	notLast: ind !== crumbs.length - 1
        }))
    }
})

Template.layout.events({
  'click .filterComponent': function (event) {
    $('.currencyFilterModal').modal('show');
  }
 });
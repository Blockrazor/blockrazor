import './layout.html'

Template.layout.helpers({
	breadcrumbs: () => {
		return Session.get('breadcrumbs') || ""
	}
})
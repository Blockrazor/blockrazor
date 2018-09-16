import './layout.html'

Template.layout.helpers({
    breadcrumbs: () => {
        let bc = Session.get('breadcrumbs') || {}

        let crumbs = bc.text.split('/')
        bc.urls = bc.urls || []
        bc.urls.push(FlowRouter.current().path)

        return crumbs.map((i, ind) => {
            if (bc.param !== undefined && i.trim() === bc.param)
                i = FlowRouter.getParam(bc.param)

            if (i !== undefined) {
                let text = TAPi18n.__(`breadcrumbs.${i.trim()}`)
                
                if (text.split('.')[0] === 'breadcrumbs')
                    text = text.split('.')[text.split('.').length - 1]

                return {
                    text: text,
                    url: bc.urls[ind],
                    notLast: ind !== crumbs.length - 1
                }
            }
        })
    }
})

Template.layout.events({
  'click .filterComponent': function (event) {
    $('.currencyFilterModal').modal('show');
  }
 });
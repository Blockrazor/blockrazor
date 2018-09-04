import { Template } from 'meteor/templating'
import { Exchanges } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './exchanges.html'

Template.exchanges.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('exchanges')
    })
})

Template.exchangeActions.events({
  'click .deleteExchange': function (event, templ) {
    Meteor.call("deleteExchange", $(event.target).data("id"), (err, res) => {
      if (!err) {
        sAlert.success(TAPi18n.__('exchanges.proposed'))
      } else {
        sAlert.error(TAPi18n.__('exchanges.problem'))
      }
    })
  }
})

Template.exchanges.helpers({
  exchanges: function() {
    return Exchanges.find({});
  },
  exchangeTable: function() {
    return {
      noDataTmpl: 'noDataTmpl',
      rowsPerPage: 500,
      showFilter: false,
      fields: [
        {
          key: 'name',
          label: TAPi18n.__('exchanges.name'),
        },
        {
          key: 'action',
          label: TAPi18n.__('exchanges.action'),
          tmpl: Template.exchangeActions
        }
      ]
    };
  }
});
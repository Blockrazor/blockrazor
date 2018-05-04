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
        sAlert.success('Exchange removal successfully proposed. Moderators will decide whether to actually delete it or not.')
      } else {
        sAlert.error('There is a problem with proposing exchange removal.')
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
          label: 'Exchange Name',
        },
        {
          key: 'action',
          label: 'Action',
          tmpl: Template.exchangeActions
        }
      ]
    };
  }
});
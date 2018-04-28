import { Template } from 'meteor/templating'
import { Exchanges } from '/imports/api/indexDB.js'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './exchanges.html'


Template.exchanges.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('exchanges')
    })
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
            fields: [{
                    key: 'name',
                    label: 'Exchange Name',
                }
            ]
        };
    }

});
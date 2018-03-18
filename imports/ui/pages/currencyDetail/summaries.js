import { Template } from 'meteor/templating'
import { HashAlgorithm, Currencies, Summaries } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie'

import './summaries.html'

Template.summaries.onCreated(function() {
    this.summaryLimit = new ReactiveVar(1)
    this.summaryCount = new ReactiveVar()
    this.summaries = new ReactiveVar([])

    this.autorun(() => {
        SubsCache.subscribe('summaries', FlowRouter.getParam('slug'))
    })

    this.autorun(() => {
        const query = {
            currencySlug: FlowRouter.getParam('slug')
        }

        this.summaries.set(Summaries.find(query, {
            limit: this.summaryLimit.get(),
            sort: {
                rating: -1,
                appealNumber: -1
            }
        }))

        this.summaryCount.set(Summaries.find({currencySlug: FlowRouter.getParam('slug')}).count());
        
        // prefetch
        Summaries.find(query, {
            limit: this.summaryLimit.get() + this.inc,
            sort: {
                rating: -1,
                appealNumber: -1
            }
        }).fetch()
    })
})

Template.summaries.helpers({
    summaries: () => Template.instance().summaries.get(),
    moreThanOne: () => Template.instance().summaryLimit.get() > 1,
    anyExist: () =>  Template.instance().summaryCount.get()
})


Template.summaries.events({
    'click #hideSummaries': (event, templateInstance) => {
        event.preventDefault()
        templateInstance.summaryLimit.set(1);
        $('#hideSummaries').toggle();
        $('#loadMoreSummaries').toggle();

    },
    'click #loadMoreSummaries': (event, templateInstance) => {
        event.preventDefault()
        templateInstance.summaryLimit.set(templateInstance.summaryCount.get());
        $('#hideSummaries').toggle();
        $('#loadMoreSummaries').toggle();
    },
    'click .help': (event, templateInstance) => {
        event.preventDefault()

        $('#addSummaryModal').modal('show')
    },
    'mouseover .help': (event, templateInstance) => {
        event.preventDefault()

        $('.help').css('cursor', 'pointer')
    },
    'focus #summary': (event, templateInstance) => {
        if (Cookies.get('addSummaryModal') !== 'true') {
            $('#addSummaryModal').modal('show')

            Cookies.set('addSummaryModal', 'true')
        }
    },
    'mouseover .currencyDetailBox': (event, templateInstance) => {
        event.preventDefault()

        if(!Summaries.find({}).count() && !Cookies.get('summaryModal')) {
            $('#summaryModal').modal('show')

            Cookies.set('summaryModal', 'true')
        }
    },
    'keyup #summary': (event, templateInstance) => {
        const max = 500

        let len = $(event.currentTarget).val().length

        if (len >= max) {
            $('#charNum').text(' you have reached the limit')
        } else {
            $('#charNum').text(`${max - len} characters left`)
        }
    },
    'click .submitNewSummary': function(event, templateInstance) {
        event.preventDefault()

        if (!Meteor.user()) {
            sAlert.error('You must be logged in to add a new summary!')
        }
        
        const data = $('#summary').val()

        if(data.length < 10 || data.length > 500) {
            sAlert.error('That entry is too short, or too long.')
        } else {
            Meteor.call('newSummary', this._id, data, (err, data) => {
                $('#summary').val('')
                $('#addNewSummary').collapse('hide');
                
                sAlert.success('Thanks! Your summary has been successfully added!')
            })
        }
    },
    'click .showAddNewSummary': (event, templateInstance) => {
        event.preventDefault()

        $('#addNewSummary').toggle()
    }
})
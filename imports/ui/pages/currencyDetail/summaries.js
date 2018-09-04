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
                appealNumber: -1,
                createdAt:-1
            }
        }))

        this.summaryCount.set(Summaries.find({currencySlug: FlowRouter.getParam('slug')}).count());
        
        // prefetch
        Summaries.find(query, {
            limit: this.summaryLimit.get() + this.inc,
            sort: {
                rating: -1,
                appealNumber: -1,
                createdAt:-1
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
            $('#charNum').text(TAPi18n.__('currency.summaries.limit'))
        } else {
            $('#charNum').text(`${max - len} ${TAPi18n.__('currency.summaries.left')}`)
        }
    },
    'click .submitNewSummary': function(event, templateInstance) {
        event.preventDefault()

        if (!Meteor.user()) {
            sAlert.error(TAPi18n.__('currency.summaries.must_login'))
        }
        
        const data = $('#summary').val()

        if(data.length < 10 || data.length > 500) {
            sAlert.error(TAPi18n.__('currency.summaries.too_short'))
        } else {
            let res 
            try {
                res = grecaptcha && grecaptcha.getResponse()
            } catch(e) {
                res = 'pass'
            }
            Meteor.call('newSummary', this._id, data, res, (err, data) => {
                if (!err) {
                    $('#summary').val('')
                    $('#addNewSummary').collapse('hide');
                    $(".cancelNewSummary").hide();
                    $(".submitNewSummary").hide();
                    $(".addNewSummaryContainer").hide();
                    $(".showAddNewSummary").show();
                    
                    sAlert.success(TAPi18n.__('currency.summaries.added'))
                } else {
                    sAlert.error(TAPi18n.__(err.reason))
                }
            })
        }
    },
    'click .showAddNewSummary': (event, templateInstance) => {
      event.preventDefault()
      $('#addNewSummary').collapse('show');
      $("#summary").focus();
      $(".cancelNewSummary").show();
      $(".submitNewSummary").show();
      $(".addNewSummaryContainer").show();
      $(".showAddNewSummary").hide();
    },
    'click .cancelNewSummary': (event, templateInstance) => {
      event.preventDefault()
      $('#addNewSummary').collapse('hide');
      $(".cancelNewSummary").hide();
      $(".submitNewSummary").hide();
      $(".addNewSummaryContainer").hide();
      $(".showAddNewSummary").show();
    }
})
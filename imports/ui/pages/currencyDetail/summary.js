import { Template } from 'meteor/templating'
import { Summaries } from '/imports/api/indexDB.js'

import Cookies from 'js-cookie'
import marked from 'marked'

import './summary.html'

Template.summary.onRendered(function(){
    $('[data-toggle="popover"]').popover({
        trigger: 'focus'
    })
})

Template.summary.helpers({
    alreadyVoted: () => _.include(Template.instance().data.appealVoted, Meteor.userId()),
    summary: function() {
        return marked(this.summary)
    }
})

Template.summary.events({
    'click .fa-thumbs-down, click .fa-thumbs-up': (event, templateInstance) => {
        Meteor.call('summaryVote', Template.instance().data._id, $(event.currentTarget).hasClass('fa-thumbs-down') ? -1 : 1, (err, data) => {
            if (err) {
                sAlert.error(err.reason)
            }
        })
    },
    'mouseover .fa-thumbs-down, mouseover .fa-thumbs-up': (event, templateInstance) => {
        $(event.currentTarget).css('cursor', 'pointer')
    }
})
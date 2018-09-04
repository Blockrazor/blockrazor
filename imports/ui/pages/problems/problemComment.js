import { Template } from 'meteor/templating'
import { Problems } from '/imports/api/indexDB'

import Cookies from 'js-cookie'
import marked from 'marked'

import './problemComment.html'

Template.problemComment.onRendered(function(){
    $('[data-toggle="popover"]').popover({
        trigger: 'focus'
    })
})

Template.problemComment.helpers({
    alreadyVoted: () => _.include(Template.instance().data.appealVoted, Meteor.userId()),
    comment: function() {
        return marked(this.text)
    },
    canAccept: function() {
        let problem = Problems.findOne({
            _id: FlowRouter.getParam('id')
        })

        return !problem.accepted && problem.type === 'question' && problem.createdBy === Meteor.userId() && this.createdBy !== Meteor.userId() // only questions can have accepted answers
    },
    accepted: function() {
        return Problems.findOne({
            _id: FlowRouter.getParam('id')
        }).accepted === this._id
    }
})

Template.problemComment.events({
        'click .reply': () => {
        $('#comment').focus();
    },
    'click .fa-thumbs-down, click .fa-thumbs-up': (event, templateInstance) => {
        Meteor.call('problemCommentVote', Template.instance().data._id, $(event.currentTarget).hasClass('fa-thumbs-down') ? -1 : 1, (err, data) => {
            if (err) {
                sAlert.error(TAPi18n.__(err.reason))
            }
        })
    },
    'click .js-accept': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('acceptAnswer', FlowRouter.getParam('id'), Template.instance().data._id, (err, data) => {
            if (!err) {
                sAlert.success(TAPi18n.__('problems.comment.accepted'))
            } else {
                sAlert.error(TAPi18n.__(err.reason))
            }
        })
    },
    'mouseover .fa-thumbs-down, mouseover .fa-thumbs-up': (event, templateInstance) => {
        $(event.currentTarget).css('cursor', 'pointer')
    }
})
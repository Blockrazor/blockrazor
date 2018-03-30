import { Template } from 'meteor/templating'
import { ProblemComments } from '/imports/api/indexDB'
import { Problems } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/staringatlights:flow-router'
import Cookies from 'js-cookie'

import './problemComments.html'
import './problemComment'

Template.problemComments.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('problemComments', FlowRouter.getParam('id'))
    })
})

Template.problemComments.helpers({
    problemComments: () => ProblemComments.find({}, {
        sort: {
            accepted: -1, // show accepted answer first
            rating: -1,
            appeal: -1
        }
    }),
	commentable: () => {
		let problem = Problems.findOne({
			_id: FlowRouter.getParam('id')
		})

		return !problem.cancelled && !problem.solved && !problem.closed
	}
})


Template.problemComments.events({
    'click .help': (event, templateInstance) => {
        event.preventDefault()

        $('#addCommentModal').modal('show')
    },
    'mouseover .help': (event, templateInstance) => {
        event.preventDefault()

        $('.help').css('cursor', 'pointer')
    },
    'focus #summary': (event, templateInstance) => {
        if (Cookies.get('addCommentModal') !== 'true') {
            $('#addCommentModal').modal('show')

            Cookies.set('addCommentModal', 'true')
        }
    },
    'keyup #comment': (event, templateInstance) => {
        const max = 500

        let len = $(event.currentTarget).val().length

        if (len >= max) {
            $('#charNum').text(' you have reached the limit')
        } else {
            $('#charNum').text(`${max - len} characters left`)
        }
    },
    'click .submitNewComment': function(event, templateInstance) {
        event.preventDefault()

        if (!Meteor.user()) {
            sAlert.error('You must be logged in to add a new comment!')
        }

        const data = $('#comment').val()

        if(data.length < 10 || data.length > 500) {
            sAlert.error('That entry is too short, or too long.')
        } else {
            Meteor.call('addProblemComment', this._id, '', data, 1, (err, data) => {
                if (!err) {
                    $('#comment').val('')
                    $('#addNewComment').collapse('hide')

                    sAlert.success('Thanks! Your comment has been successfully added!')
                } else {
                    sAlert.error(err.reason)
                }
            })
        }
    },
    'click .showAddNewComment': (event, templateInstance) => {
        event.preventDefault()

        $('#addNewComment').toggle()
    }
})

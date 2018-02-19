import { RatingsTemplates } from '../../lib/database/Ratings'


Template.questions.events({
  'submit form': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('addRatingQuestion', event.target.question.value, $('#js-cat').val(), $('#js-negative').is(':checked'), $('#affects').val().split(','), (err, data) => {});
    $('#question').val('')
    $('#affects').val('')
  },
  'click .js-delete': function(event, templateInstance) {
  	Meteor.call('deleteQuestion', this._id, (err, data) => {})
  },
  'click .js-context': function (event, templateInstance) {
  	Meteor.call('toggleContextQuestion', this._id, (err, data) => {})
  }
})

Template.questions.helpers({
	questions: () => RatingsTemplates.find({}),
	// you can only change questions you've added
	author: function() {
		return true; //Meteor.userId() === this.createdBy
	}
})

Template.questions.onCreated(function() {
	this.autorun(() => {
		this.subscribe('ratings_templates')
	})
})

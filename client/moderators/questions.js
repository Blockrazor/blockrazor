import { RatingsTemplates } from '../../lib/database/Ratings'


Template.questions.events({
  'submit form': (event, templateInstance) => {
    event.preventDefault()
    Meteor.call('addRatingQuestion', event.target.question.value, $('#js-cat').val(), $('#js-negative').is(':checked'), $('#context').val() || '', (err, data) => {});
    $('#question').val('')
  },
  'click .js-delete': function(event, templateInstance) {
  	Meteor.call('deleteQuestion', this._id, (err, data) => {})
  },
  'click .js-context': function (event, templateInstance) {
  	Meteor.call('toggleContextQuestion', this._id, (err, data) => {})
  },
  'change #js-cat': (event, templateInstance) => {
  	event.preventDefault()

  	templateInstance.category.set($(event.currentTarget).val())
  }
})

Template.questions.helpers({
	questions: () => RatingsTemplates.find({}),
	// you can only change questions you've added
	author: function() {
		return true; //Meteor.userId() === this.createdBy
	},
	needsContext: () => ~['decentralization'].indexOf(Template.instance().category.get())
})

Template.questions.onCreated(function() {
	this.autorun(() => {
		this.subscribe('ratings_templates')
	})

	this.category = new ReactiveVar('wallet')
})

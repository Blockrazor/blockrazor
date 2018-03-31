import { RatingsTemplates } from '/imports/api/indexDB.js'

import './questions.html'

Template.questions.events({
  'submit form': (event, templateInstance) => {
    event.preventDefault()

    let xors = []

    $('.js-xors').each((ind, i) => xors.push($(i).val())).filter(i => !!i)

    Meteor.call(
		'addRatingQuestion',
		event.target.question.value,
		$('#js-cat').val(),
		$('#js-negative').is(':checked'),
		$('#context').val() || '',
		xors,
		(err, data) => {
			console.log('err >>>>>', err);
		});
    $('#question').val('')
    templateInstance.xor.set(false)
    templateInstance.xors.set([1])
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
  },
  'click #js-add-xor': (event, templateInstance) => {
  	event.preventDefault()

  	let l = templateInstance.xors.get()
  	l.push(l.length + 1)

  	templateInstance.xors.set(l)
  },
  'click #js-xor': (event, templateInstance) => {
  	templateInstance.xor.set(!templateInstance.xor.get())
  }
})

Template.questions.helpers({
	questions: () => RatingsTemplates.find({}),
	isXor: function() {
		return this.xors && this.xors.length
	},
	// you can only change questions you've added
	author: function() {
		return true; //Meteor.userId() === this.createdBy
	},
	needsContext: () => ~['decentralization'].indexOf(Template.instance().category.get()),
	xor: () => Template.instance().xor.get(),
	xors: () => Template.instance().xors.get(),
	questionsCat: () => RatingsTemplates.find({
		$or: [{
			catagory: Template.instance().category.get()
		}, {
			context: Template.instance().category.get()
		}]
	}).fetch()
})

Template.questions.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('ratings_templates')
	})

	this.category = new ReactiveVar('wallet')
	this.xors = new ReactiveVar([1])
	this.xor = new ReactiveVar(false)
})

import { Template } from 'meteor/templating'
import { UserData, Problems } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/staringatlights:flow-router'
import swal from 'sweetalert'

import './problem.html'
import './problemImages'
import './problemComments'

Template.problem.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('problem', FlowRouter.getParam('id'))
		SubsCache.subscribe('users')
	})

	this.working = new ReactiveVar(false)

	Meteor.call('isWorkingOnAProblem', Meteor.userId() || '', (err, data) => {
		this.working.set(data)
	})
})

Template.problem.onRendered(function() {
	$.fn.editable.defaults.mode = 'inline' // display them inline
  	$.fn.editableform.buttons = `<button type="submit" class="btn btn-primary btn-sm editable-submit"><i class="fa fa-check"></i></button><button type="button" class="btn btn-default btn-sm editable-cancel"><i class="fa fa-close"></i></button>` // custom buttons with fa icons

	let editables = ['header', 'text'] 

	const validate = function(val) { // the actual proposing part
	    if ($(this).text() !== val) {
	    	Meteor.call('editProblem', FlowRouter.getParam('id'), $(this).attr('id'), val, (err, data) => {
	    		if (!err) {
	    			sAlert.success('Successfully edited.')
	    		} else {
	    			sAlert.error(err.reason)
	    		}
	    	})

	    	return ''
	    }

	    return 'Please change the value if you want to propose a change.'
	}
	
	this.autorun(() => {
		var problem = Problems.findOne({_id: FlowRouter.getParam('id')})
		editables.forEach(i => $(`#${i}`).editable({
		   	validate: validate,
		   	disabled: !problem.open || problem.locked || problem.createdBy != Meteor.userId()
		}))
	})
})

Template.problem.helpers({
	question: () => Problems.findOne({
		_id: FlowRouter.getParam('id')
	}).type === 'question',
	takeable: function() {
		let problem = Problems.findOne({
			_id: FlowRouter.getParam('id')
		})
		return !problem.cancelled && !problem.solved && !problem.closed
	},
	userContribution: function(){
		var user = Meteor.userId()
		return Problems.findOne({
			_id: FlowRouter.getParam('id')
		}).credit.reduce((a, x)=>{
			if (x.userId == user){
				return a + x.bounty
			} else {
				return a
			}
		}, 0)
	},
	problem: () => Problems.findOne({
		_id: FlowRouter.getParam('id')
	}),
	problemNR: () => Problems.find({
		_id: FlowRouter.getParam('id')
	}, {
		reactive: false
	}).fetch()[0] || {}, // a non reactive problem, to prevent duplication of text when used with x-editable
	isAuthor: () => (Problems.findOne({
		_id: FlowRouter.getParam('id')
	}) || {}).createdBy === Meteor.userId(),
	amount: function() {
		return this.credit.reduce((i1, i2) => i1 + i2.bounty, 0)
	},
	canCancel: function() {
		return this.createdBy === Meteor.userId() && !this.locked
	},
	isTaken: () => {
		let problem = Problems.findOne({
			_id: FlowRouter.getParam('id')
		})

		return !_.isEmpty(problem.taken)
	},
	user: function() {
		return Meteor.users.findOne({
			_id: Problems.findOne({
				_id: FlowRouter.getParam('id')
			}).taken.userId
		}).username
	},
	timeLeft: function() {
		let m = moment.duration(this.taken.date + 5*24*60*60*1000 - new Date().getTime()) // 5 days

		return `${Math.floor(m.asHours())}:${m.minutes()}:${m.seconds()}`
	},
	isTakenByMe: function() {
		return this.taken.userId === Meteor.userId()
	},
	canTake: () => !Template.instance().working.get(),
	balance: () => (UserData.findOne({
		_id: Meteor.userId()
	}) || {}).balance,
	fixed: (val) => val.toFixed(6)
})

Template.problem.events({
	'click #js-addCredit': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('addProblemCredit', FlowRouter.getParam('id'), Number($('#js-credit').val()), (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} else {
				sAlert.success('Credit added.')
			}
		})
	},
	'click #js-removeCredit': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('removeProblemCredit', FlowRouter.getParam('id'), (err, data) => {
			if (err) {
				sAlert.error(err.reason)
			} else {
				sAlert.success('Credit removed.')
			}
		})
	},
	'click #js-cancel': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('cancelProblem', FlowRouter.getParam('id'), (err, data) => {
			if (!err) {
				sAlert.success('Cancelled.')
			} else {
				sAlert.error(err.reasom)
			}
		})
	},
	'click #js-giveup': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('giveUpProblem', FlowRouter.getParam('id'), (err, data) => {
			if (!err) {
				sAlert.success('Successfully gave up.')
			} else {
				sAlert.error(err.reasom)
			}
		})
	},
	'click #js-solve': (event, templateInstance) => {
		event.preventDefault()

		Meteor.call('solveProblem', FlowRouter.getParam('id'), (err, data) => {
			if (!err) {
				sAlert.success('Successfully marked as solved. You\'ll be rewarded if the solution is accepted.')
			} else {
				sAlert.error(err.reasom)
			}
		})
	},
	'click #js-take': (event, templateInstance) => {
		event.preventDefault()

		if($('#js-fork').val()=="" || $('#js-issue').val() ==""){
				sAlert.error('Please ensure both fields are populated')

		}else{

		Meteor.call('takeProblem', FlowRouter.getParam('id'), {
			fork: $('#js-fork').val(),
			issue: $('#js-issue').val()
		}, (err, data) => {
			if (!err) {
				sAlert.success('The problem is yours. You have 5 days to solve it.')
			} else {
				sAlert.error(err.reasom)
			}
		})
	}
	}
})
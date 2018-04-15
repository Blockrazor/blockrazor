import { Template } from 'meteor/templating'
import { Problems } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './problems.html'

window.Problems = Problems

Template.problems.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('problems')
		SubsCache.subscribe('users')
	})

	this.filter = new ReactiveVar('')
	this.level = new ReactiveVar('ALL')
})

Template.problems.events({
	'click .focusSearch':function(){
		$('#js-search').focus();
	},
	'keyup #js-search': (event, templateInstance) => {
		event.preventDefault()
		$('#addProblemButton').removeClass('disabled not-allowed');
		templateInstance.filter.set($(event.currentTarget).val())
	},
	'submit #problemsFilter': (event, templateInstance) => {
		event.preventDefault()
	},
	'change #js-level': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.level.set($(event.currentTarget).val())
	}
})

Template.problems.helpers({
	problems: () => {
		let query = {
			$or: [{
				heading: new RegExp(Template.instance().filter.get(), 'ig')
			}, {
				text: new RegExp(Template.instance().filter.get(), 'ig')
			}]
		}

		if (Template.instance().level.get()) {
			let l = Template.instance().level.get()

			if (l === 'OPEN') {
				query['open'] = true
			} else if (l === 'IN PROGRESS') {
				query['open'] = true
				query['locked'] = true
				query['solved'] = false
			} else if (l === 'SOLVED') {
				query['open'] = true
				query['solved'] = true
			} else if (l === 'CLOSED') {
				query['closed'] = true
				query['open'] = false
			}
		}

		return Problems.findLocal(query, {
			sort: {
				date: -1
			}
		})
	},
	status: function() {
		if (this.closed) {
			return 'CLOSED'
		}

		if (this.cancelled) {
			return 'CANCELLED'
		}

		if (this.solved) {
			return 'SOLVED'
		}

		if (this.locked) {
			return 'IN PROGRESS'
		} 

		if (this.open) {
			return 'OPEN'
		}
	},
	newType:function(){
		 if(this.type =='bug' || this.type =='feature'){
		 	return 'PROBLEM';
		 }else{
		 	return 'QUESTION';
		 }
		
	},


	statusColor: function(status) {
		return status === 'OPEN' ? 'green' : (status === 'SOLVED' || status === 'IN PROGRESS') ? 'orange' : 'red'
	},
	user: function() {
		return (Meteor.users.findOne({
			_id: this.createdBy
		}) || {}).username || 'N\\A'
	}
})

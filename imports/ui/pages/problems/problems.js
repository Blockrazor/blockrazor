import { Template } from 'meteor/templating'
import { Problems } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './problems.html'
import './problems.scss'

window.Problems = Problems

function setFilters(filterPref, newItem) {

	if (newItem && filterPref.indexOf('ALL') != -1 && newItem != 'ALL') {
		filterPref = [newItem];
	}

	if (!filterPref.length) {
		filterPref = ['OPEN']
	}

	if (filterPref.indexOf('ALL') != -1) {
		filterPref = ['ALL']
	}
	setCheckBoxes(filterPref);
	return filterPref;
}

function setCheckBoxes(levels) {
	$('#all-problems').prop('checked', (levels.indexOf('ALL')!= -1 || levels.length == 0))
	$('#open-problems').prop('checked', (levels.indexOf('OPEN')!= -1  || levels.length == 0))
	$('#in-progress-problems').prop('checked', (levels.indexOf('IN PROGRESS')!= -1))
	$('#solved-problems').prop('checked', (levels.indexOf('SOLVED')!= -1))
  $('#closed-problems').prop('checked', (levels.indexOf('CLOSED')!= -1))
}

Template.problems.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('problems')
		SubsCache.subscribe('users')
	})

	this.filter = new ReactiveVar('')
	this.levels = new ReactiveVar(['OPEN'])
})

Template.problems.onRendered(function(){
	setCheckBoxes(Template.instance().levels.get());
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
	'click .form-check-input': (event, templateInstance) => {
		var setFilter = templateInstance.$('input:checked').map(function() {
				return $(this).val()
		});
		setFilter = $.makeArray(setFilter)
		templateInstance.levels.set(setFilters(setFilter, $(event.currentTarget).val()));
	}
})

Template.problems.helpers({
	problems: () => {
		let query = {
			$or: [{
				header: new RegExp(Template.instance().filter.get(), 'ig')
			}, {
				text: new RegExp(Template.instance().filter.get(), 'ig')
			}]
		}

		if (Template.instance().levels.get()) {
			let l = Template.instance().levels.get()
			if (l.indexOf('OPEN') != -1) {
				query['open'] = true
			} else if (l.indexOf('IN PROGRESS') != -1) {
				query['open'] = true
				query['locked'] = true
				query['solved'] = false
			} else if (l.indexOf('SOLVED') != -1) {
				query['open'] = true
				query['solved'] = true
			} else if (l.indexOf('CLOSED') != -1) {
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
			return TAPi18n.__('problems.problems.closed').toUpperCase()
		}

		if (this.cancelled) {
			return TAPi18n.__('problems.problems.cancelled').toUpperCase()
		}

		if (this.solved) {
			return TAPi18n.__('problems.problems.solved').toUpperCase()
		}

		if (this.locked) {
			return TAPi18n.__('problems.problems.in_progress').toUpperCase()
		}

		if (this.open) {
			return TAPi18n.__('problems.problems.open').toUpperCase()
		}
	},
	newType:function(){
		 if(this.type =='bug' || this.type =='feature'){
		 	return TAPi18n.__('problems.problems.problem').toUpperCase()
		 }else{
		 	return TAPi18n.__('problems.problems.question').toUpperCase()
		 }

    },
    badgeType: function() {
        return this.type =='bug' || this.type =='feature' ? 'badge-danger' : 'badge-info';
    },
	statusColor: function(status) {
		return status === TAPi18n.__('problems.problems.open').toUpperCase() ? 'green' : (status === TAPi18n.__('problems.problems.solved').toUpperCase() || status === TAPi18n.__('problems.problems.in_progress').toUpperCase()) ? 'orange' : 'red'
	},
	user: function() {
		return (Meteor.users.findOne({
			_id: this.createdBy
		}) || {}).username || 'N\\A'
	}
})

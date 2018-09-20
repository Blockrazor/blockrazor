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
  'error .summary-author img': function(e) {
    // fires when a particular image doesn't exist in given path
    if ($(e.target).attr('src') !== '/codebase_images/noprofile.png') {
        $(e.target).attr('src', '/codebase_images/noprofile.png')
    }
  },
    'click .fa-thumbs-down, click .fa-thumbs-up': (event, templateInstance) => {
		Meteor.call('vote', 'Summaries', Template.instance().data._id, $(event.currentTarget).hasClass('fa-thumbs-down') ? 'down' : 'up', (error, data) => {
			if(!error) {
				$(event.currentTarget).addClass('text-info');
				if ($(event.currentTarget).hasClass('fa-thumbs-down')) {
					$(event.currentTarget).parent().find('.fa-thumbs-up').removeClass('text-info');
				} else {
					$(event.currentTarget).parent().find('.fa-thumbs-down').removeClass('text-info');
				}

			} else {sAlert.error(TAPi18n.__(error.reason))};
		});
    },
    'mouseover .fa-thumbs-down, mouseover .fa-thumbs-up': (event, templateInstance) => {
        $(event.currentTarget).css('cursor', 'pointer')
    }
})

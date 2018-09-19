import { Template } from 'meteor/templating'
import { Features } from '/imports/api/indexDB.js'

import Cookies from 'js-cookie'

import './feature.html'
import './commentRender'

Template.feature.onCreated(function() {
  this.autorun(() => {
    SubsCache.subscribe('comments', this._id);
  })

  this.showingComments = new ReactiveDict()
});
Template.feature.onRendered(function(){
  $('[data-toggle="popover"]').popover({ trigger: 'focus' })
})

Template.feature.helpers({
	numComments: function() {
		return _.size(Features.find({parentId: this._id}).fetch());
	},
	starsid: function() {
		return "star-" + this._id
	},
	bountyamount: function () {
		return "<FIXME>"; //FIXME
	},
	parentId: function() {
		return this.parentId;
	},
	comments: function() { //return database showing comments with parent: this._id
		return Features.find({parentId: this._id, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}}).fetch();
	}
});

Template.feature.events({
  'error .post-author img': function(e) {
    // fires when a particular image doesn't exist in given path
    if ($(e.target).attr('src') !== '/codebase_images/noprofile.png') {
      $(e.target).attr('src', '/codebase_images/noprofile.png')
    }
  },
  'click .fa-thumbs-down': function(event) {
    Meteor.call('vote', 'Features', this._id, "down", function(error,result) {
      if(!error) {
        $(event.currentTarget).addClass('text-info');
		$(event.currentTarget).parent().find('.fa-thumbs-up').removeClass('text-info');
      } else {sAlert.error(TAPi18n.__(error.reason))};
    });
  },
  'click .fa-thumbs-up': function(event) {
    Meteor.call('vote', 'Features', this._id, "up", function(error,result) {
      if(!error) {
        $(event.currentTarget).addClass('text-info');
		$(event.currentTarget).parent().find('.fa-thumbs-down').removeClass('text-info');
      } else {sAlert.error(TAPi18n.__(error.reason))};
    });
  },
  'mouseover .fa-thumbs-down': function() {
    $('.fa-thumbs-down').css('cursor', 'pointer');
  },
  'mouseover .fa-thumbs-up': function() {
    $('.fa-thumbs-up').css('cursor', 'pointer');
  },
  'mouseover .flag': function() {
    $('.flag').css('cursor', 'pointer');
  },
  'click .flag': function() {
    $('#flagModal-' + this._id).modal('show');
  },
  'click .flagButton': function() {
    $('#flagModal-' + this._id).modal('hide');
    Meteor.call('flag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success(TAPi18n.__('currency.feature.thanks'));
      } else {
        sAlert.error(TAPi18n.__(error.reason));
      }
    });
  },
  'click .submitNewComment': function () {
    if(!Meteor.user()) {
      sAlert.error(TAPi18n.__('currency.feature.must_login'));
    }
    var data = $('#replyText-' + this._id).val();
    var ifnoterror = function(){
    }
    if(data.length < 6 || data.length > 140) {
      sAlert.error(TAPi18n.__('currency.feature.too_short'));
    } else {
      let res 
      try {
        res = grecaptcha && grecaptcha.getResponse()
      } catch(e) {
        res = 'pass'
      }
      Meteor.call('newComment', this._id, data, 1, res, function(error, result) {
        if(!error) {
          sAlert.success(TAPi18n.__('currency.feature.posted'));
        } else {
          sAlert.error(TAPi18n.__(error.reason));
          return;
        }
      });
      $('#replyText-' + this._id).val(" ");
      $(".newcomment-" + this._id).hide();
      Cookies.set("submitted" + this._id, true);
      $(".commentParent-" + this._id).hide();
      Template.instance().showingComments.set(this._id, "false")
    }
  },
  'keyup .replyText': function() {
    $('.replyText').keyup(function () {
  var max = 140;
  var len = $(this).val().length;
  if (len >= max) {
    $('#replyCharNum' + this._id).text(TAPi18n.__('currency.feature.limit'));
  } else {
    var char = max - len;
    $("#replyCharNum" + this._id).text(char + TAPi18n.__('currency.feature.left'));
  }
});
  },
  'focus .replyText': function() {
    $(".replyFooter-" + this._id).show();
  },
    'click .comments': function() {
      if(Cookies.get("submitted" + this._id) != "true") {
      $(".newcomment-" + this._id).show();
      $("#replyBox-" + this._id).hide();
      $("#replyText-" + this._id).focus();

    };
  if(Template.instance().showingComments.get(this._id) != "true") {
    $(".commentParent-" + this._id).show();
    Template.instance().showingComments.set(this._id, "true")
  } else {
    $(".commentParent-" + this._id).hide();
    $(".newcomment-" + this._id).hide();
    Template.instance().showingComments.set(this._id, "false")
  }

  },
  'mouseover .comments': function() {
    $('.comments').css('cursor', 'pointer');
  },
  'mouseover .reply': function() {
  },
  'click .reply': function() {
    $("." + this._id).toggle();
  },
  'click .wymihelp': function() {
    $('#wymiModal').modal('show');
  },
  'mouseover .wymihelp': function() {
    $('.wymihelp').css('cursor', 'pointer');
  },
});

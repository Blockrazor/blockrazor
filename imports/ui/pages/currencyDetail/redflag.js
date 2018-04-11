import { Template } from 'meteor/templating'
import { Redflags } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie';

import './redflag.html'

Template.redflag.onCreated(function() {
  this.autorun(() => {
    SubsCache.subscribe('redflagcomments', this._id);
  })

  this.showingComments = new ReactiveDict()
});

Template.redflag.helpers({
    alreadyVoted: function(id){
    if(_.include(Redflags.findOne(id).appealVoted, Meteor.userId())){
      return true;
    }
  },
  numComments: function() {
    return _.size(Redflags.find({parentId: this._id}).fetch());
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
    return Redflags.find({parentId: this._id, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}});
  }
});



Template.redflag.events({
	'click .fa-thumbs-down': function(event) {
      Meteor.call('vote', 'Redflags', this._id, "down", function(error,result) {
        if(!error) {
          $(event.currentTarget).addClass('text-info');
  		$(event.currentTarget).parent().find('.fa-thumbs-up').removeClass('text-info');
        } else {sAlert.error(error.reason)};
      });
    },
    'click .fa-thumbs-up': function(event) {
      Meteor.call('vote', 'Redflags', this._id, "up", function(error,result) {
        if(!error) {
          $(event.currentTarget).addClass('text-info');
  		$(event.currentTarget).parent().find('.fa-thumbs-down').removeClass('text-info');
        } else {sAlert.error(error.reason)};
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
    Meteor.call('redflag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success("Thanks for letting us know!");
      } else {
        sAlert.error(error.reason);
      }
    });
  },
  'click .submitNewComment': function () {
    if(!Meteor.user()) {
      sAlert.error("You must be logged in to comment!");
    }
    var data = $('#replyText-' + this._id).val();
    var ifnoterror = function(){
    }
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      let res 
      try {
        res = grecaptcha && grecaptcha.getResponse()
      } catch(e) {
        res = 'pass'
      }
      Meteor.call('redFlagNewComment', this._id, data, 1, res, function(error, result) {
        if(!error) {
          sAlert.success("Thanks! Your comment has been posted!");
        } else {
          sAlert.error(error.reason);
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
    $('#replyCharNum' + this._id).text(' you have reached the limit');
  } else {
    var char = max - len;
    $("#replyCharNum" + this._id).text(char + ' characters left');
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

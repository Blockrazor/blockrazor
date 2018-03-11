import { Template } from 'meteor/templating'
import { Redflags, Currencies } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie';

import './redflags.html'
import './redflag.js'
import './redflagComment.js'

Template.redflags.onCreated(function(){
  this.showredflagged = new ReactiveVar(false)
  this.addingnewredflag = new ReactiveVar(false)
  this.lastId = new ReactiveVar('')

  this.autorun(() => {
    this.currencyId = (Currencies.findOne({ slug: FlowRouter.getParam("slug") }) || {})._id

    if (this.currencyId) {
      SubsCache.subscribe('redflags', this.currencyId)
    }
  })
});


Template.redflags.helpers({
    alreadyVoted: function(id){
    if(_.include(Redflags.findOne(id).appealVoted, Meteor.userId())){
      return true;
    }
  },
  redflagDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  redflags: function() {
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}});
  },
  redflagsFlagged: function() {
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$gt: 0.6}});
  }
});

Template.redflags.events({
  'click .showRedFlagged': function() {
    if(Template.instance().showredflagged.get() == false) {
      Template.instance().showredflagged.set(true);
      $('.showRedFlagged').text("Show");
    } else {
      Template.instance().showredflagged.set(false)
      $('.showRedFlagged').html("Hide");
    }
},
  'click .help': function() {
    $('#addFeatureModal').modal('show');
  },
  'mouseover .help': function() {
    $('.help').css('cursor', 'pointer');
  },
  'focus #featureName': function() {
    if(Cookies.get('addFeatureModal') != "true") {
      $('#addFeatureModal').modal('show');
      Cookies.set('addFeatureModal', true);
    }
  },
  'mouseover .currencyDetailBox': function() {
    if(_.size(Redflags.find({}).fetch()) == 0 && !Cookies.get('featureModal')) {
      $('#featureModal').modal('show');
      Cookies.set('featureModal', true);
    }
  },
  'keyup #featureName': function() {
    $('#featureName').keyup(function () {
  var max = 140;
  var len = $(this).val().length;
  if (len >= max) {
    $('#charNum').text(' you have reached the limit');
  } else {
    var char = max - len;
    $('#charNum').text(char + ' characters left');
  }
});
  },
  'click .submitRedFlag': function () {
    if(!Meteor.user()) {
      sAlert.error("You must be logged in to red flag a currency");
    }
    var data = $('#redflagContent').val();
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      Meteor.call('newRedFlagMethod', this._id, data);
      $('#redflagContent').val(" ");
      $('#showAddNewRedflag').toggle();
      $('.redflagheading').text("Red Flag Currency");
      Template.instance().addingnewredflag.set(false);
      sAlert.success("Thanks! Red flag added");
    }
  },
  'click .showAddNewRedflag': function() {
    $('#showAddNewRedflag').toggle();
    if(!Template.instance().addingnewredflag.get()) {
      $('.redflagheading rating').text("Red Flag Currency");
      Template.instance().addingnewredflag.set(true);
    } else {
      $('.redflagheading rating').text("Red Flag");
      Template.instance().addingnewredflag.set(false);
    }
  },
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Template.instance().lastId.set(this._id);


  }
});


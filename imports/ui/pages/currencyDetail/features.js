import { Template } from 'meteor/templating'
import { HashAlgorithm, Currencies, Features } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie'

import './features.html'

Template.features.onCreated(function(){
  this.showflagged = new ReactiveVar(false)
  this.addingnewfeature = new ReactiveVar(false)
  this.lastId = new ReactiveVar('')

  this.autorun(() => {
    SubsCache.subscribe('featuresSlug', FlowRouter.getParam('slug'))
  })
});

Template.features.helpers({
  featureDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  features: function() {
    return Features.find({currencySlug: FlowRouter.getParam('slug'), flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}});
  },
  flaggedfeatures: function() {
    return Features.find({currencySlug: FlowRouter.getParam('slug'), flagRatio: {$gt: 0.6}});
  }
});


Template.features.events({
  'click .showFlagged': function() {
    if(Template.instance().showflagged.get() == false) {
      Template.instance().showflagged.set(true);
      $('.showFlagged').text("Hide");
      $('.flag').css("color", "#FF6600");
    } else {
      Template.instance().showflagged.set(false)
      $('.showFlagged').text("Show");
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
    if(_.size(Features.find({}).fetch()) == 0 && !Cookies.get('featureModal')) {
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
  'click .submitNewFeature': function () {
    if(!Meteor.user()) {
      sAlert.error("You must be logged in to add a new feature!");
    }
    var data = $('#featureName').val();
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      Meteor.call('newFeature', this._id, data);
      $('#featureName').val(" ");
      $('#addNewFeature').toggle();
      $('.featuresheading').text("Features");
      Template.instance().addingnewfeature.set(false);
      sAlert.success("Thanks! That feature has been added!");
    }
  },
  'click .showAddNewFeature': function() {
    $('#addNewFeature').toggle();
    if(!Template.instance().addingnewfeature.get()) {
      $('.featuresheading').text("Add a new feature");
      Template.instance().addingnewfeature.set(true);
    } else {
      $('.featuresheading').text("Features");
      Template.instance().addingnewfeature.set(false);
    }
  },
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}

    Template.instance().lastId.set(this._id);


  }
});
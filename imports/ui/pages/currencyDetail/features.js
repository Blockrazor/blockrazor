import { Template } from 'meteor/templating'
import { HashAlgorithm, Currencies, Features } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie'

import './features.html'

Template.features.onCreated(function(){
  this.showflagged = new ReactiveVar(false)
  this.addingnewfeature = new ReactiveVar(false)
  this.lastId = new ReactiveVar('')
  this.featureIncrement = 6
  this.featureLimit = new ReactiveVar(this.featureIncrement)
  this.featuresShow = new ReactiveVar(null)
  this.autorun(() => {
    SubsCache.subscribe('featuresSlug', FlowRouter.getParam('slug'))
  })

  //prefetch next load of features into minimongo
  this.autorun(()=>{
    var query = {currencySlug: FlowRouter.getParam('slug'), flagRatio: {$lt: 0.6}}
    this.featuresShow.set(Features.find(query, {limit: this.featureLimit.get(), sort: {rating: -1, appealNumber: -1,createdAt:-1}}));
    //prefetch
    Features.find(query, {limit: this.featureLimit.get()+this.featureIncrement, sort: {rating: -1,createdAt:-1, appealNumber: -1}}).fetch()
  })
});

Template.features.helpers({
  featureDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  features: function() {
    return Template.instance().featuresShow.get().fetch()
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
  'click #loadMoreFeatures': function(ev, templ){
    templ.featureLimit.set(templ.featureLimit.get()+templ.featureIncrement)
  },
  'click .feature-help-button .help': function() {
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
  'mouseover .currency-features .currencyDetailBox': function() {
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
    $('#charNumFeature').text(' you have reached the limit');
  } else {
    var char = max - len;
    $('#charNumFeature').text(char + ' characters left');
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
      let res 
      try {
        res = grecaptcha && grecaptcha.getResponse()
      } catch(e) {
        res = 'pass'
      }
      const templ = Template.instance()
      Meteor.call('newFeature', this._id, data, res, (err, data) => {
        if (!err) {
          $('#featureName').val(" ");
          $(".showAddNewFeature").show();
          $(".addNewFeatureContainer").hide();
          templ.addingnewfeature.set(false);
          sAlert.success("Thanks! That feature has been added!")
        } else {
          sAlert.error(err.reason)
        }
      })
     

      
    }
  },
  'click .showAddNewFeature': function() {
    $(".showAddNewFeature").hide();
    $(".addNewFeatureContainer").show();
    $("#featureName").focus();
  },
  'click .cancelNewFeature': function() {
    $(".showAddNewFeature").show();
    $(".addNewFeatureContainer").hide();
  },
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}

    Template.instance().lastId.set(this._id);


  }
});
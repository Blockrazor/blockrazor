import { Template } from 'meteor/templating'
import { HashAlgorithm, Currencies, Features } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie'

import './features.html'
import { newFeature } from '/imports/api/features/methods' 

Template.features.onCreated(function(){
  this.showflagged = new ReactiveVar(false)
  this.addingnewfeature = new ReactiveVar(false)
  this.loadMore = new ReactiveVar(true)
  this.lastId = new ReactiveVar('')
  this.featureIncrement = 3
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
  },
    loadMoreActive: function() {
    return Template.instance().loadMore.get()
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

    let currentCount = templ.featuresShow.get().count()

    if(templ.featureLimit.get() > currentCount){
    templ.loadMore.set(false);
    }
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
    $('#charNumFeature').text(TAPi18n.__('currency.features.limit'));
  } else {
    var char = max - len;
    $('#charNumFeature').text(char + TAPi18n.__('currency.features.left'));
  }
});
  },
    'click .submitNewFeature': function(event, templateInstance) {
        if (!Meteor.user()) {
            sAlert.error(TAPi18n.__('currency.features.must_login'))
        }

        const data = $('#featureName').val()

        let res
        try {
            res = grecaptcha && grecaptcha.getResponse()
        } catch (e) {
            res = 'pass'
        }

        newFeature.call({
            coinId: this._id,
            featureName: data, 
            captcha: res
        }, (err, data) => {
            if (!err) {
                $('#featureName').val(' ')
                $('.showAddNewFeature').show()
                $('.addNewFeatureContainer').hide()
                templateInstance.addingnewfeature.set(false)
                sAlert.success(TAPi18n.__('currency.features.added'))
            } else {
                if (err.details) {
                    err.details.forEach(i => {
                        sAlert.error(i.message)
                    })
                } else {
                    sAlert.error(TAPi18n.__(err.reason))
                }
            }
        })
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
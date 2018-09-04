import { Template } from 'meteor/templating'
import { Redflags, Currencies } from '/imports/api/indexDB.js'
import Cookies from 'js-cookie';

import './redflags.html'
import './redflag.js'
import './redflagComment.js'

Template.redflags.onCreated(function(){
  this.showredflagged = new ReactiveVar(false)
  this.addingnewredflag = new ReactiveVar(false)
  this.loadMore = new ReactiveVar(true)
  this.lastId = new ReactiveVar('')
  this.redflagIncrement = 3
  this.redflagLimit = new ReactiveVar(this.redflagIncrement)
  this.redflagShow = new ReactiveVar(null)

  this.autorun(() => {
    this.currencyId = (Currencies.findOne({ slug: FlowRouter.getParam("slug") }) || {})._id

    if (this.currencyId) {
      SubsCache.subscribe('redflags', this.currencyId)

      var query = {currencyId: this.currencyId, flagRatio: {$lt: 0.6}}
      this.redflagShow.set(Redflags.find(query, {limit: this.redflagLimit.get(), sort: {rating: -1, appealNumber: -1,createdAt:-1}}));
      //prefetch
      Redflags.find(query, {limit: this.redflagLimit.get()+this.redflagIncrement, sort: {rating: -1,createdAt:-1, appealNumber: -1}}).fetch()
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
    return Template.instance().redflagShow.get().fetch()
    // return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1,createdAt:-1},limit: 3}).fetch();
  },
  redflagsFlagged: function() {
    return Redflags.find({currencyId: Template.instance().currencyId, flagRatio: {$gt: 0.6}},{limit: 3});
  },
    loadMoreActive: function() {
    return Template.instance().loadMore.get()
  }
});

Template.redflags.events({
  'click #loadMoreRedflags': function(ev, templ){
    templ.redflagLimit.set(templ.redflagLimit.get()+templ.redflagIncrement)

    let currentCount = templ.redflagShow.get().count()

    if(templ.redflagLimit.get() > currentCount){
    templ.loadMore.set(false);
    }
  },
  'click .flag-help-button .help': function() {
    $('#addRedFlagModal').modal('show');
  },
  'mouseover .help': function() {
    $('.help').css('cursor', 'pointer');
  },
  'focus #redflagContent': function() {
    if(Cookies.get('addRedFlagModal') != "true") {
      $('#addRedFlagModal').modal('show');
      Cookies.set('addRedFlagModal', true);
    }
  },
  'mouseover .currency-redflags .currencyDetailBox': function() {
    if(_.size(Redflags.find({}).fetch()) == 0 && !Cookies.get('addRedFlagModal')) {
      $('#addRedFlagModal').modal('show');
      Cookies.set('addRedFlagModal', true);
    }
  },
  'keyup #redflagContent': function() {
    $('#redflagContent').keyup(function () {
  var max = 140;
  var len = $(this).val().length;
  if (len >= max) {
    $('#charNumFlag').text(TAPi18n.__('currency.redflags.limit'));
  } else {
    var char = max - len;
    $('#charNumFlag').text(char + TAPi18n.__('currency.redflags.left'));
  }
});
  },
  'click .submitRedFlag': function () {
    if(!Meteor.user()) {
      sAlert.error(TAPi18n.__('currency.redflags.must_login'));
    }
    var data = $('#redflagContent').val();
    if(data.length < 6 || data.length > 140) {
      sAlert.error(TAPi18n.__('currency.redflags.too_short'));
    } else {
      let res 
      try {
        res = grecaptcha && grecaptcha.getResponse()
      } catch(e) {
        res = 'pass'
      }
      const templ = Template.instance()
      Meteor.call('newRedFlagMethod', this._id, data, res, (err, data) => {
        if (!err) {
          $('#redflagContent').val(" ");
          $(".showAddNewRedflag").show();
          $(".addNewRedflagContainer").hide();
          templ.addingnewredflag.set(false);
          sAlert.success(TAPi18n.__('currency.redflags.added'))
        } else {
          sAlert.error(TAPi18n.__(err.reason))
        }
      })
    }
  },
  'click .showAddNewRedflag': function() {
    $(".showAddNewRedflag").hide();
    $(".addNewRedflagContainer").show();
    $("#redflagContent").focus();
  },
  'click .cancelNewRedFlag': function() {
    $(".showAddNewRedflag").show();
    $(".addNewRedflagContainer").hide();
  },
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Template.instance().lastId.set(this._id);


  }
});


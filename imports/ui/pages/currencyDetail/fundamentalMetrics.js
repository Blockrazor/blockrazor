import { Template } from 'meteor/templating'
import { Features } from '../../../api/indexDB.js'
import { WalletImages } from '../../../api/indexDB.js'
import { Currencies } from '../../../api/indexDB.js'
import { GraphData } from '../../../api/indexDB.js'
import Cookies from 'js-cookie'

import "../../components/radarGraph.js"

// import '../userProfile/userHover' //is broken import //import the userHover template for later usage (we have to import it everywhere we want to use it)

//todo
//need to create a global js file to store global helpers
Template.registerHelper('relativeTime', function(date) {
  var timePassed = moment(date).fromNow();
  return timePassed;
});

Template.fundamentalMetrics.onCreated(function() {
  this.autorun(() => {
    SubsCache.subscribe('graphdata')
    SubsCache.subscribe('approvedcurrencies')
  })
})

Template.fundamentalMetrics.onRendered(function (){

});

Template.fundamentalMetrics.events({
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Template.instance().lastId.set(this._id);
  }
});

Template.fundamentalMetrics.helpers({
  options: function (){
    return {
                responsive: false,
                defaultFontColor: 'red',
              tooltips: {enabled: false},
              maintainAspectRatio: false,
              title: {display: false},
              legend: {
                display: false,
                position: 'bottom',
                labels: {
                  fontColor: 'red',
                  display: true,
                }
              },
              scale: {
                pointLabels: {fontSize: 14},
    
              // Hides the scale
              display: true
          }
            }
  },
  metricDescription: function () {
    return this.metricTag; //find metricTag data from collection
  },
  metrics: function() {
    var metrics = [{
      _id: "938274n5982735498",
      currencyName: "Bitcoin",
      name: "Ongoing Development",
      commitsYear: 1245,
      commits60day: 244,
      metricTag: "ongoingDevelopment"
    },
    {
      _id: "btyreybtrebret",
      name: "Code Quality",
      commitsYear: 1245,
      commits60day: 244
    },
    {
      _id: "635756745",
      name: "Coin Distribution",
      commitsYear: 1245,
      commits60day: 244
    },
    {
      _id: "73567567",
      name: "Community",
      commitsYear: 1245,
      commits60day: 244
    }];

    return metrics;
  }
});
Template.feature.onCreated(function() {
  this.autorun(() => {
    SubsCache.subscribe('comments', this._id);
  })

  this.showingComments = new ReactiveDict()
});
Template.feature.onRendered(function(){
  $('[data-toggle="popover"]').popover({ trigger: 'focus' })
})


Template.comment.helpers({

    alreadyVotedOnComment: function(id) {
      console.log('comment:', id)
        if (_.include(Features.findOne({parentId: id}).appealVoted, Meteor.userId())) {

            return true;
        }
    },
})

Template.feature.helpers({
  alreadyVoted: function(id){
    if(_.include(Features.findOne(id).appealVoted, Meteor.userId())){
      return true;
    }
  },
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
    return Features.find({parentId: this._id, flagRatio: {$lt: 0.6}}, {sort: {rating: -1, appealNumber: -1}});
  }
});

Template.feature.events({
  'click .fa-thumbs-down': function(event) {
    Meteor.call('vote', this._id, "down", function(error,result) {
      if(!error) {
        $(event.currentTarget).parent().html('<i class="fa fa-check" aria-hidden="true"></i>');
      } else {sAlert.error(error.reason)};
    });
  },
  'click .fa-thumbs-up': function(event) {
    Meteor.call('vote', this._id, "up", function(error,result) {
      if(!error) {
        $(event.currentTarget).parent().html('<i class="fa fa-check" aria-hidden="true"></i>');
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
    Meteor.call('flag', this._id, function(error, resonse) {
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
      Meteor.call('newComment', this._id, data, 1, function(error, result) {
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

Template.discussion.helpers({
  totalComments: function () {
    return 123;
  },
  topComment: function() {
    return [{
      _id: "3456435",
      commentText: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies.",
      currencyId: "56735836736",
      authorName: "bitcoinfan",
      authorId: "985273948"
    }];

  },
  topReply: function() {
    return [{
      _id: "83958374",
      parentId: "3456435",
      commentText: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient.",
       authorName: "dashfan",
       authorId: "2345354"
    }]
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

Template.comment.events({
  'click .flag': function() {
  $('#flagModal-' + this._id).modal('show');
  
  },
  'click .commentFlag': function() {
    $('#flagModal-' + this._id).modal('hide');
    Meteor.call('flag', this._id, function(error, resonse) {
      if(!error){
        sAlert.success("Thanks for letting us know!");
      } else {
        sAlert.error(error.reason);
      }
    });
  }

});

Template.walletimages.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('walletImagesSlug', FlowRouter.getParam('slug'))
  });
});

Template.walletimages.helpers({
  walletimages: function () {
    return WalletImages.find({currencySlug: FlowRouter.getParam('slug')});
  },
  walletimagesdir(){
    return _walletUpoadDirectoryPublic;
  }
});

//
// Template.metricContent.onRendered(function (){
//   // Session.set('thisId', this.data._id);
//   // if (Session.get('lastId')) {
//   //   document.getElementById(Session.get('lastId')).style.display = "none";
//   // }
//   // document.getElementById(this.data._id).style.display = "block";
//   // Session.set('lastId', this.data._id);
// });

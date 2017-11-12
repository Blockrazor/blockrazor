import { Template } from 'meteor/templating';
import { Features } from '../../../lib/database/Features.js';

Template.fundamentalMetrics.onRendered(function (){
  var radar = document.getElementById("radar").getContext('2d');
  radar.canvas.width = 800;
  radar.canvas.height = 600;
    var radarchart = new Chart(radar, {
        type: 'radar',
        data: {
          labels: ["Ongoing Development", "Code Quality", "Community", "Hash Power", "Settlement Speed", "Ease of Use", "Coin Distribution", "Transactions"],
          datasets: [
            {
              label: "1950",
              fill: true,
              backgroundColor: "rgba(255,120,50,0.2)",
              borderColor: "#FF6600",
              pointBorderColor: "#fff",
              pointStyle: "dot",
              pointBackgroundColor: "#FF0000",
              data: [6,7,2,2,7,8,1,3]
            },
            {
              label: "2",
              fill: false,
              backgroundColor: "#fff",
              borderColor: "#ccc",
              pointBorderColor: "#fff",
              borderWidth: 4,
              pointRadius: 0,
              pointBackgroundColor: "#fff",
              data: [10,10,10,10,10,10,10,10]
            },
            {
              label: "3",
              fill: false,
              backgroundColor: "#fff",
              borderColor: "#fff",
              borderWidth: 1,
              pointBorderColor: "#fff",
              pointBackgroundColor: "#fff",
              data: [0,0,0,0,0,0,0,0]
            }
          ]
        },
          options: {
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
    });

});

Template.fundamentalMetrics.events({
  'click #name': function () {
    if(Session.get('lastId')){document.getElementById(Session.get('lastId')).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Session.set('lastId', this._id);


  }
});

Template.fundamentalMetrics.helpers({
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
  console.log("ID");
  console.log(this.data._id);
  this.autorun(() => {
    this.subscribe('comments', this._id);
  });
});
Template.feature.onRendered(function(){

})
Template.feature.helpers({
  bountyamount: function () {
    return "<FIXME>"; //FIXME
  },
  parentId: function() {
    return this.parentId;
  },
  comments: function() { //return database showing comments with parent: this._id
    return Features.find({parentId: this._id}).fetch();
  }
});

Template.feature.events({
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
    if(data.length < 6 || data.length > 140) {
      sAlert.error("That entry is too short, or too long.");
    } else {
      Meteor.call('newComment', this._id, data, 1);
      $('#replyText-' + this._id).val(" ");
      $(".newcomment-" + this._id).hide();
      Cookies.set("submitted" + this._id, true);
      $(".commentParent-" + this._id).hide();
      Session.set("showingComments" + this._id, "false")
      sAlert.success("Thanks! Your comment has been posted!");
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
    $('#replyText-' + this._id).height(60);
    $('#replyText-' + this._id).attr("placeholder", "Comments should be friendly, useful to others, and factually correct. If you see bad behavior, don't encourage it by replying, simply flag it and move on.");
  },
  'click .comments': function() {
    if(Cookies.get("submitted" + this._id) != "true") {
    $(".newcomment-" + this._id).show();
  };
  if(Session.get("showingComments" + this._id) != "true") {
    $(".commentParent-" + this._id).show();
    Session.set("showingComments" + this._id, "true")
  } else {
    $(".commentParent-" + this._id).hide();
    Session.set("showingComments" + this._id, "false")
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
  console.log(FlowRouter.getParam("_id"));
  this.autorun(() => {
    this.subscribe('features', FlowRouter.getParam("_id"));
  });
});

Template.features.helpers({
  featureDescription: function () {
    return this.featureTag; //find metricTag data from collection
  },
  features: function() {
    return Features.find({currencyId: FlowRouter.getParam("_id"), flagRatio: {$lt: 0.6}}).fetch();
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
  'click .help': function() {
    $('#addFeatureModal').modal('show');
  },
  'mouseover .help': function() {
    $('.help').css('cursor', 'pointer');
  },
  'focus #featureName': function() {
    if(Cookies.get('addFeatureModal') != "true") {
      console.log("fdgdsgfds");
      $('#addFeatureModal').modal('show');
      Cookies.set('addFeatureModal', true);
    }
  },
  'mouseover .currencyDetailBox': function() {
    if(_.size(Features.find({}).fetch()) == 0 && !Cookies.get('featureModal')) {
      $('#featureModal').modal('show');
      Cookies.set('featureModal', true);
      console.log("0");
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
      sAlert.success("Thanks! That feature has been added!");
    }
  },
  'click .showAddNewFeature': function() {
    $('#addNewFeature').toggle();
  },
  'click #name': function () {
    if(Session.get('lastId')){document.getElementById(Session.get('lastId')).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Session.set('lastId', this._id);


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

//
// Template.metricContent.onRendered(function (){
//   // Session.set('thisId', this.data._id);
//   // if (Session.get('lastId')) {
//   //   document.getElementById(Session.get('lastId')).style.display = "none";
//   // }
//   // document.getElementById(this.data._id).style.display = "block";
//   // Session.set('lastId', this.data._id);
// });

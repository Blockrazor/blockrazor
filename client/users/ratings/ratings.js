import { Template } from 'meteor/templating';
import { Currencies } from '../../../lib/database/Currencies.js';
import { Ratings } from '../../../lib/database/Ratings.js';

Template.ratings.onCreated(function bodyOnCreated() {
  Meteor.subscribe('approvedcurrencies');
});

Template.displayRatings.onCreated(function bodyOnCreated() {
  Meteor.subscribe('ratings');
});

Template.question.onCreated(function bodyOnCreated() {
  Meteor.subscribe('approvedcurrencies');
});

Template.currencyChoice.onRendered(function () {
  console.log(this.data._id);
  var instance = this;
  $("#toggle" + instance.data._id).click(function(){
    $("#upload" + instance.data._id).toggle()
  });
});

Template.ratings.onRendered(function(){
  Meteor.subscribe('ratings', function(onReady){
    console.log("ready!");
    var length = Ratings.find({}).fetch().length;
    console.log(length);
    if (length == 0) {
      $("#outstandingRatings").hide();
      $("#currencyChoices").show();
    };
    if (length > 0) {
      $("#outstandingRatings").show();
      $("#currencyChoices").hide();
    }
  });

});

Template.ratings.events({
  'click #elo': function() {
      Meteor.call('tabulateElo');
  }
})

Template.ratings.helpers({
  populateUI() {
  },
  outstandingRatings() {
    var length = Ratings.find({}).fetch().length;
    if (length == 0) {
      $("#outstandingRatings").hide();
      $("#currencyChoices").show();
    };
    return length;
  }
});

Template.currencyChoices.helpers({
  md5() {
    return CryptoJS.MD5('Message').toString();
  },
  currencies() {
        return Currencies.find({});
      }//}
});

Template.currencyChoices.events({
  'click #populateRatings': function(){
    Meteor.call('populateRatings', function(error,result){
      if(error){
        console.log(error.reason);
      } else {
        window.location.reload();
      }
    })
  }
});

Template.displayRatings.helpers({
  questions(){
    return Ratings.findOne({});
  }
});

Template.question.helpers({
  currency0Name(){
    return Currencies.findOne({_id: this.currency0Id}).currencyName
  },
  currency1Name(){
    return Currencies.findOne({_id: this.currency1Id}).currencyName
  }
});

Template.question.events({
  'mouseover .choice': function(){
    $('.choice').css('cursor', 'pointer');
  },
  'click .choice': function(event){
    Meteor.call('answerRating', this._id, event.currentTarget.id);
  }
});

Template.upload.events({
  'change input': function(event){
   var instance = this;
   var file = event.target.files[0];
   var reader = new FileReader();
   reader.onload = function(fileLoadEvent){
     //var binary = event.target.result;
     var binary = reader.result;
     var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();
     console.log(md5);
     Meteor.call('uploadWalletImage', file.name, event.target.id, instance._id, reader.result, md5, function(error, result){
       if(error){
         //salert
       }
       //console.log(result);
     });
   }
   reader.readAsBinaryString(file);
}
});

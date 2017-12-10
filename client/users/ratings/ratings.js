import { Template } from 'meteor/templating';
import { Currencies } from '../../../lib/database/Currencies.js';

Template.ratings.onCreated(function bodyOnCreated() {
  Meteor.subscribe('approvedcurrencies');
});


Template.currencyChoices.helpers({
  md5() {
    return CryptoJS.MD5('Message').toString();
  },
  currencies() {
        return Currencies.find({});
      }//}
});

Template.currencyChoice.events({
  'click #click': function(event){
    Meteor.call('click');
  },
  'change input': function(event){
   var file = event.target.files[0];
   if (!file) {console.log("PROBLEM"); return;};

   var xhr = new XMLHttpRequest();
   xhr.open('PUT', '/uploadSomeWhere', true);
   xhr.onload = function(event){}

   xhr.send(file);
}
});

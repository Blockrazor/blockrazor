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
    var md5 = false;
   var file = event.target.files[0];
        console.log("safdas");
   var reader = new FileReader();
   reader.onload = function(event){
     var binary = event.target.result;
     let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();
     Meteor.call('uploadImage', Meteor.userId(), md5);
     console.log(md5);
   }
   reader.readAsBinaryString(file);
   var xhr = new XMLHttpRequest();
   xhr.open('PUT', '/uploadSomeWhere', true);
   xhr.onload = function(event){}
   xhr.send(file);
}
});

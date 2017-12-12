import { Template } from 'meteor/templating';
import { Currencies } from '../../../lib/database/Currencies.js';

Template.ratings.onCreated(function bodyOnCreated() {
  Meteor.subscribe('approvedcurrencies');
});

Template.currencyChoice.onRendered(function () {
  console.log(this.data._id);
  var instance = this;
  $("#toggle" + instance.data._id).click(function(){
    console.log(instance.data._id);
    $("#upload" + instance.data._id).toggle()
  })
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
  'change input': function(event){
   var instance = this;
   var file = event.target.files[0];
   var reader = new FileReader();
   reader.onload = function(fileLoadEvent){
     //var binary = event.target.result;
     var binary = reader.result;
     var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();
     Meteor.call('uploadWalletImage', file.name, event.target.id, instance._id, reader.result, md5, function(error, result){
       console.log(error);
       console.log(result);
     });
   }
   reader.readAsBinaryString(file);
}
});

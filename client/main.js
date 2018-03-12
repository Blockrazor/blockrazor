import { Accounts } from 'meteor/accounts-base';
import '/imports/startup/client';
import { UserData } from '/imports/api/indexDB.js';


Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

//Global helpers for accessing reactive vars on the current template
Template.registerHelper('reactiveVar', name => Template.instance()[name].get())
Template.registerHelper('reactiveVar.equals', (name, val) => Template.instance()[name].get() == val) //== (not ===) mimics the behaviour of $.Session.equals)

//Global helper to easily get session values in templates
Template.registerHelper( 'session', ( name ) => {
  return Session.get(name);
})

//get public coin image location
Template.registerHelper( '_coinUpoadDirectory', ( string ) => {
  return _coinUpoadDirectory;
});

Template.registerHelper('doesCoinImageExist', function(img) {
    if(img){
    	return _coinUpoadDirectoryPublic + img;
    }else{
    	return '/images/noimage.png'
    }
})

Template.registerHelper('relativeTime', function(date) {
  var timePassed = moment(date).fromNow();
  return timePassed;
});


    //Global helpers
    Template.registerHelper('isModerator', function() {
        var isModerator = UserData.findOne({ _id: Meteor.userId }, { fields: { moderator: true } });
        if (isModerator && isModerator.moderator) {
            return isModerator.moderator;
        }
    });

   Template.registerHelper('isDeveloper', () => {
       let udata = UserData.findOne({
           _id: Meteor.userId()
       }, {
           fields: {
               developer: true
           }
       })

       return udata && udata.developer
   })

   Template.registerHelper('subsCacheReady', () => {
       return SubsCache.ready()
   })

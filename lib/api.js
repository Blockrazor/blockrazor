 import { UserData } from './database/UserData.js';

 if (Meteor.isClient) {
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
 }

 br = (function() {
     var api = {};

     api.isModerator = function() {
         var data = UserData.findOne({ _id: Meteor.userId() });
         if (data) {
             return data.moderator;
         }
     };

     return api;
 }());
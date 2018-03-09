 import { UserData } from '/imports/api/indexDB.js';

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

    Template.registerHelper('subsCacheReady', () => {
        return SubsCache.ready()
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
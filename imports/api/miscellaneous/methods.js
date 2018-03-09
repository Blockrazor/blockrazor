import { Meteor } from 'meteor/meteor'
import { FormData } from '/imports/api/indexDB.js'

if (Meteor.isServer) {
  Meteor.methods({
    insertFormData(data) {
      FormData.insert(data, function (error, result) {
        if (!result) {
          console.log(error);
          //return error;
          throw new Meteor.Error('Invalid', error);
        } else {
          //console.log(error);
          //console.log(result);
          return "OK";
        }
      });
    }
  })
}
import { Meteor } from 'meteor/meteor'
import { Redflags } from '/imports/api/indexDB.js'

Meteor.publish('redflags', function(id) {
  if(!id) {
    console.log("Redflags NoID");
    return Redflags.find({});
  } else {
    console.log("Redflags ID: " + id);
    return Redflags.find({currencyId: id});
  }
});

Meteor.publish('redflagcomments', function(id) {
  if(!id) {
    console.log("Redflags NoID");
    return Redflags.find({});
  } else {
    console.log("Redflags ID: " + id);
    return Redflags.find({parentId: id});
  }
});
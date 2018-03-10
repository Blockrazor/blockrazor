import { Template } from 'meteor/templating'

import { Ratings } from '/imports/api/indexDB.js';
import './displayRatings.html'

Template.displayRatings.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('ratings');
  })
});

Template.displayRatings.helpers({
  questions(){
    return Ratings.findOne({
      $or: [{
        answered: false,
        catagory: 'wallet'
      }, {
        answered: false,
        context: 'wallet'
      }]
    });
  }
});
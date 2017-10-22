import { Template } from 'meteor/templating';
//import { Currencies } from '../lib/database/Currencies.js'; //database

Template.edit.events({

});

Template.edit.helpers({
    launchdate () {
      if ((FlowRouter.getQueryParam("edit")) == "launchdate") {
      return true;
    } else {
      return false;
    }}
});

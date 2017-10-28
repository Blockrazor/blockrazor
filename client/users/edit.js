import { Template } from 'meteor/templating';

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

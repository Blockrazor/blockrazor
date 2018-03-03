import { Template } from 'meteor/templating';

Template.desktop.events({
  'click #navbar-toggler': function(event) {
    event.preventDefault();
    $('#sidebar').toggleClass('active');
  }
});
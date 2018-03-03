import { Template } from 'meteor/templating';

Template.desktop.events({
  'click #sidebarCollapse': function(event) {
    event.preventDefault();
    $('#sidebar').toggleClass('active');
  }
});
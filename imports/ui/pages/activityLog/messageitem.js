import { Template } from 'meteor/templating';

import './messageitem.html'

Template.messageitem.helpers({
  time() {
        return moment(this.time).fromNow();
      }
});

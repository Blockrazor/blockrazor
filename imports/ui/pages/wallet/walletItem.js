import { Template } from 'meteor/templating';

import './walletItem.html'

Template.walletItem.helpers({
  time() {
        return moment(this.time).fromNow();
      }
});

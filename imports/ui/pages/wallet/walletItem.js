import { Template } from 'meteor/templating';

import './walletItem.html'
import './wallet-item.scss'

Template.walletItem.helpers({
  time() {
        return moment(this.time).fromNow();
      }
});

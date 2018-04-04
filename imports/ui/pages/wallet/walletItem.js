import { Template } from 'meteor/templating';

import './walletItem.html'
import './wallet-item.scss'

Template.walletItem.helpers({
  time() {
    return new Date(this.time).toLocaleString([], {day:'numeric',month:'short',year:'numeric',hour: '2-digit', minute:'2-digit'});
  }
});

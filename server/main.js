import { Meteor } from 'meteor/meteor';
  import {generateBounties, createtypes} from '../lib/database/Bounties.js';
//import * as jobs from './API_requests/github.js';

Accounts.onLogin(function(user){

  //generateBounties();
  //createtypes();
  if (user.type != "resume") {
    Meteor.call('initializeUser');
    Meteor.call('initializeActivityLog');
    Meteor.call('initializeWallet');
  }
});

// FastRender.route('/', function(){
// this.subscribe('approvedcurrencies');
// });

Meteor.startup(() => {
//jobs.initiate_later();
SyncedCron.start();

//jobs.print();
  // code to run on server at startup
});

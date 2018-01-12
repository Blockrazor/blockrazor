import { Meteor } from 'meteor/meteor';
  import {generateBounties, createtypes, fetchHashrate} from '../lib/database/Bounties.js';
//import * as jobs from './API_requests/github.js';

Accounts.onLogin(function(user){

  //generateBounties();
  //createtypes();
  // console.log("-----")
  // console.log(fetchHashrate("t9u2tSq9o8CMPzCAu"));
  // console.log("end")
  if (user.type != "resume") {
    Meteor.call('initializeUser');
    Meteor.call('initializeActivityLog');
    Meteor.call('initializeWallet');
  }
});

ServiceConfiguration.configurations.upsert({
    service: "facebook"
}, {
    $set: {
        loginStyle: "popup",
        appId: Meteor.isDevelopment ? "dev_app_id" : "prod_app_id",
        secret: Meteor.isDevelopment ? "dev_secret_key" : "prod_secret_key",
    }
});

Accounts.onCreateUser(( options, user ) => {
    // If a username is set in the user's profile field, then copy it in user.username
    if  ( user.services && user.services.facebook && user.services.facebook.name ) {
        user.username = user.services.facebook.name;
    }

    return ( user );
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

import { Meteor } from 'meteor/meteor';
import {generateBounties, createtypes, fetchHashrate} from '../lib/database/Bounties.js';
import { Logger } from 'meteor/ostrio:logger';
import { LoggerMongo } from 'meteor/ostrio:loggermongo';
//import * as jobs from './API_requests/github.js';

log = new Logger();
(new LoggerMongo(log)).enable();


Accounts.validateLoginAttempt(function(result){

var user = result.user;

if(result.error){
  var message = result.error.reason;
  var data = {'user': user, 'connection': result.connection}
  log.error(message, data);
}else{
  var message = 'login event';
  var data = {'user': user, 'connection': result.connection}
  log.info(message, data);
}

  return true;

});

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
   service: "github"
}, {
    $set: {
        loginStyle: "popup",
        clientId:  "clientId",
        secret:  "secret"
    }
});

Accounts.onCreateUser(( options, user ) => {
    if  ( user.services && user.services.github && user.services.github.name ) {
        user.username = user.services.github.name;
    }

    
  var message = 'user created';
  var data = {'user': user}
  log.info(message, data,user._id);

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

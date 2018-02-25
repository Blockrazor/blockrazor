import { Meteor } from 'meteor/meteor';
import {generateBounties, createtypes, fetchHashrate} from '../lib/database/Bounties.js';
import { AppLogs } from '../lib/database/AppLogs.js';
import { Logger } from 'meteor/ostrio:logger'; 

import { LoggerMongo } from 'meteor/ostrio:loggermongo'
import { UserData } from '../lib/database/UserData'

import '/imports/startup/server';


//import * as jobs from './API_requests/github.js';

// to prevent code duplication and redundancy, we simply export the logger so other files can use it easily
export var log = new Logger();
(new LoggerMongo(log, {
  collection: AppLogs
})).enable();


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
      //let's check if the user has logged in multiple users on the same ip address 
      Meteor.call('getUserConnectionInfo',
        (error, result) => {
            if (error) {
                log.error('Error in getUserConnectionInfo', error)
            } else {
                  //Check if another user has already registed with the same client IP address
                  var ipAddress = result.clientAddress;
                  let duplicateLogins = UserData.find({
                    _id: {
                      $ne: Meteor.userId()
                    }, 
                    'sessionData.loggedIP': ipAddress
                  }).count()

                  //if multiple logins exist, raise a warning.
                  if(duplicateLogins){
                    var message = 'duplicate login';
                    var data = {'user': user,'connection':result}
                    log.warn(message, data,Meteor.userId())

                    UserData.update({
                      _id: Meteor.userId()
                    }, {
                      $set: {
                        'flags.duplicate.accessIP': true
                      }
                    })
                  }

            }
        }
    );

  //generateBounties();
  //createtypes();
  // console.log("-----")
  // console.log(fetchHashrate("t9u2tSq9o8CMPzCAu"));
  // console.log("end")
  Meteor.call('initializeUser')
  if (user.type != "resume") {
    Meteor.call('initializeActivityLog');
    Meteor.call('initializeWallet');
  }
});

Accounts.onCreateUser(( options, user ) => {  
    // grab the fb username and email for the Meteor.users() object
    if  ( user.services && user.services.facebook && user.services.facebook.name ) {
        user.username = user.services.facebook.name;
        user.email = user.services.facebook.email;
    }

    // grab the github username and email for the Meteor.users() object
    if  ( user.services && user.services.github && user.services.github.username ) {
        user.username = user.services.github.username;
        user.email = user.services.github.email;
    }

    if (!user.email) {
      user.email = user.emails[0].address
    }

    if (Meteor.users.find({
      $or: [
        {
          email: user.email
        },
        {
          'emails.address': user.email
        }
      ]
    }).count() > 0) {
      log.error('Error in createUser, email already in use.', user)
      throw new Meteor.Error('Error', 'Email is already in use.')
    }

//switching to a meteor Method on onCreateUser as this.connection returns null if we don't.
    Meteor.call('getUserConnectionInfo',
        (error, result) => {
            if (error) {
                log.error('Error in getUserConnectionInfo', error)
            } else {
                  //Check if another user has already registed with the same client IP address
                  var ipAddress = result.clientAddress;
                  let ipAddressExist = UserData.find({
                    'sessionData.loggedIP': ipAddress
                  }).count()

                  //if a user exist with the same registered IP address, raise a warning.
                  if(ipAddressExist){
                    var message = 'duplicate user detected';
                    var data = {'user': user,'connection':result}
                    log.warn(message, data,user._id)
                  }

                  //Create event for new user
                  var message = 'user created';
                  var data = {'user': user,'connection':result}
                  log.info(message, data,user._id);
            }
        }
    );

    return ( user );
});

// FastRender.route('/', function(){
// this.subscribe('approvedcurrencies');
// });

Meteor.startup(() => {
//jobs.initiate_later();
SyncedCron.start();
Meteor.call('convertAlgorithm', (err, data) => {})
//jobs.print();
  // code to run on server at startup
});
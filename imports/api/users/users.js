import { Meteor } from 'meteor/meteor';
import { UserData, ActivityIPs } from '/imports/api/indexDB.js';
import Analytics from 'analytics-node'
var analytics = new Analytics('auAfRv1y0adOiVyz1TZB9nl18LI9UT98')

import { updateUsersStats } from './usersStats'


import { log } from '/imports/api/utilities'

//is in fact server only file

 /* function to init segment users, this is required 
for us to map userId in meteor to transactions in 
segment.io */

function initSegmentIOUser(userId,email,fullname){
  analytics.identify({
  userId:userId,
  traits: {
    name: fullname,
    email: email,
    createdAt: new Date()
  }
});
}

Meteor.users.friendlySlugs({
  slugFrom: 'username',
  slugField: 'slug',
  distinct: true,
  updateSlug: true,
  debug: false,
  transliteration: [{ from: 'ü', to: 'u' }, { from: 'õö', to: 'o'}]
}) // create a URL friendly slug from the username

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

     //init segment.IO user
    initSegmentIOUser(user.user._id,user.user.username,user.user.email)
    
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

                    const acIP = ActivityIPs.findOne({
                      ip: ipAddress
                    })

                    if (!acIP) {
                      ActivityIPs.insert({
                        ip: ipAddress,
                        votes: [],
                        score: 0,
                        upvotes: 0,
                        downvotes: 0,
                        lastAccess: new Date().getTime()
                      })  
                    } else {
                      ActivityIPs.update({
                        _id: acIP._id
                      }, {
                        $set: {
                          lastAccess: new Date().getTime()
                        }
                      })
                    }
              }
          }
      );
  
    Meteor.call('initializeUser')
    if (user.type != "resume") {
      Meteor.call('initializeActivityLog');
      Meteor.call('initializeWallet');
    }
  });
  
  var onCreateUserCallBacks = [updateUsersStats]

  Accounts.onCreateUser(( options, user ) => {  
      // grab the fb username, email and profile picture for the Meteor.users() object
      if  ( user.services && user.services.facebook && user.services.facebook.name ) {
          user.username = user.services.facebook.name;
          user.email = user.services.facebook.email;

          user.profilePicture = `https://graph.facebook.com/${user.services.facebook.id}/picture?type=small`
          user.profilePicture = `https://graph.facebook.com/${user.services.facebook.id}/picture?type=large` // default url for facebook images
      }
  
      // grab the github username and email for the Meteor.users() object
      if  ( user.services && user.services.github && user.services.github.username ) {
          user.username = user.services.github.username;
          user.email = user.services.github.email
  
          user.profilePicture.small = `https://avatars.githubusercontent.com/u/${user.services.github.id}?s=400` // default url for github images
          user.profilePicture.large = `https://avatars.githubusercontent.com/u/${user.services.github.id}?s=400` // default url for github images
      }

      user.inviteCode = Random.id(20)
  
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
  
      onCreateUserCallBacks.forEach(x=>x(options, user))

      return ( user );
  })

Meteor.startup(() => {
    Meteor.call('generateInviteCode', (err, data) => {})

    SyncedCron.add({
        name: 'Reward referral programme',
        schedule: (parser) => parser.cron('0 12 * * *'), // every day at 12pm
        job: () => Meteor.call('rewardReferral', (err, data) => {}) // drain rate is 0.01 KZR per minute
    })

    SyncedCron.add({
        name: 'Calculate user input ranking',
        schedule: (parser) => parser.text('every 2 hours'),
        job: () => Meteor.call('userInputRanking', (err, data) => {}) // drain rate is 0.01 KZR per minute
    })
})
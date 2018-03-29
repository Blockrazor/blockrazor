import { Accounts } from 'meteor/accounts-base';
import '/imports/startup/client';
import { UserData, Features, Summaries, Redflags } from '/imports/api/indexDB.js';

const collections = { Features, Summaries, Redflags }

import Cookies from 'js-cookie'

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY',
});

//Global helpers for accessing reactive vars on the current template
Template.registerHelper('reactiveVar', name => Template.instance()[name].get())
Template.registerHelper('reactiveVar.equals', (name, val) => Template.instance()[name].get() == val) //== (not ===) mimics the behaviour of $.Session.equals)

//Global helper to easily get session values in templates
Template.registerHelper( 'session', ( name ) => {
  return Session.get(name);
})

//get public coin image location
Template.registerHelper( '_coinUpoadDirectory', ( string ) => {
  return _coinUpoadDirectory;
});

Template.registerHelper('doesCoinImageExist', function(img) {
    if(img){
      let thumbnail_filename = img.split('.')[0] + '_thumbnail.' + img.split('.')[1];
    	return _coinUpoadDirectoryPublic + thumbnail_filename;
    }else{
    	return '/images/noimage.png'
    }
})



    //Global helpers
    Template.registerHelper('isModerator', function() {
        var isModerator = UserData.findOne({ _id: Meteor.userId }, { fields: { moderator: true } });
        if (isModerator && isModerator.moderator) {
            return isModerator.moderator;
        }
    });

Template.registerHelper('isDeveloper', () => {
       let udata = UserData.findOne({
           _id: Meteor.userId()
       }, {
           fields: {
               developer: true
           }
       })

       return udata && udata.developer
   })

   Template.registerHelper('subsCacheReady', () => {
       return SubsCache.ready()
   })



Template.registerHelper('slugify', function(author) {
    SubsCache.subscribe('user', author)

    return (Meteor.users.findOne({
        username: author
    }) || {}).slug

})

Template.registerHelper('relativeTime', function(date) {
  var timePassed = moment(date).fromNow();
  return timePassed;
});

Template.registerHelper('nlToBr', function(value) {
    return value.replace(/(?:\r\n|\r|\n)/g, '<br />');
});

Template.registerHelper('hasUserVoted', (collection, collectionId, direction) => {
	var doc = collections[collection].findOne(collectionId);
	var downVoted = doc.downVoted;
	var appealVoted = doc.appealVoted;

	if (direction === 'down') { return _.include(downVoted, Meteor.userId()) }
	return _.include(appealVoted, Meteor.userId());
});


Template.registerHelper('profilePicture', (pic) => {

    if (pic) {
        return _profilePictureUploadDirectoryPublic + pic
    } else {
        return '/images/noprofile.png'
    }
});


Template.registerHelper('significant', (val) => {
    if (val) {
        var val = parseInt(val);
        return Number(val.toPrecision(5));
    }else{
      return 0;
    }

})

let cap = new ReactiveVar('')

Template.registerHelper('captcha', () => {
    Meteor.subscribe('myUserData')

    Meteor.call('getCaptcha', (err, data) => {
        cap.set(data)
    })

    let user = UserData.findOne({
        _id: Meteor.userId()
    })

    user.activity = user.activity || []
    user.activity = user.activity.sort((i1, i2) => i2.time - i1.time)

    if ((user && user.activity.length > 1 && (user.activity[0].time - user.activity[1].time < 10000))) { // needs captcha if he's posting too fast (10 seconds between)
        return `Please complete the captcha before posting<br/>${cap.get()}`
    } else {
        return ''
    }
})

transactionTypes = function(type) {

    if (!_validTransactionTypes.includes(type)) {
        return ' - ';
    } else {

        switch (type) {
            case 'topCommentReward':
                return 'Top Comment Reward'
                break;
            case 'hashReward':
                return 'Hash Reward'
                break;
            case 'bountyReward':
                return 'Bounty Reward'
                break;
            case 'problemReward':
                return 'Problem Reward'
                break;
            case 'createCoinReward':
                return 'Create Coin Reward'
                break;
            case 'cheating':
                return 'Cheating Penalty'
                break;
            case 'anwserQuestion':
                return 'Question Reward'
                break;
        }
    }
}

Template.registerHelper('transactionTypes', (transaction) => {
        transactionTypes(transaction);
})

if (window.location.hash) {
    if (!Meteor.userId()) { // if user is not logged in, save the token for later usage, e.g. when the user registers
        if (localStorage) {
            localStorage.setItem('inviteToken', window.location.hash.substr(1))
        } else { // fallback to Cookies as some devices do not support localstorage
            Cookies.set('inviteToken', window.location.hash.substr(1))
        }
    }

    window.location.hash = '' // remove the hash
}

Tracker.autorun(() => {
    let token = (localStorage && localStorage.getItem('inviteToken')) || Cookies.get('inviteToken')

    if (token && Meteor.userId()) {
        let user = Meteor.users.findOne({
            _id: Meteor.userId()
        })

        if (user && !user.referral) { // user is not referred by anyone and he has a token in the local storage
            Meteor.call('setReferral', token, (err, data) => {
                if (localStorage) {
                    localStorage.setItem('inviteToken', '')
                } else {
                    Cookies.set('inviteToken', '')
                }
            })
        }
    }
})
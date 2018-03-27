import { Accounts } from 'meteor/accounts-base';
import '/imports/startup/client';
import { UserData, Features, Summaries, Redflags } from '/imports/api/indexDB.js';

const collections = { Features, Summaries, Redflags }

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
        return Number(val.toPrecision(3));
    }else{
      return 0;
    }

Template.registerHelper('transactionTypes', (transaction) => {

  if(!_validTransactionTypes.includes(transaction)){
    throw new Meteor.Error('error', 'Invalid Transaction Type Used')
  }else{

    switch (transaction) {
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
});
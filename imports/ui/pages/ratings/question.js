import { Template } from 'meteor/templating';
import { Currencies, Ratings } from '/imports/api/indexDB.js';

import './question.html'

Template.question.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('approvedcurrencies');
  })

  this.cnt = 0
  this.ties = 0
  this.timeToAnswer = 0
})


Template.question.helpers({
  getLogo(img){
    if(img){
      return _coinUpoadDirectoryPublic + img;
    }else{
      return '/images/noimage.png'
    }
  },
  currency0(){
    return Currencies.findOne({_id: this.currency0Id});
  },
  currency1(){
    return Currencies.findOne({_id: this.currency1Id});
  },
    outstandingRatings() {
    var count = Ratings.find({
      $or: [{
        answered: false,
        catagory: 'wallet'
      }, {
        answered: false,
        context: 'wallet'
      }]
    }).count();
    if (!count) {
      $("#outstandingRatings").hide();
      $("#currencyChoices").show();
    };
    return count;
  }
});

Template.question.events({
  'mouseover .choice': function(){
    $('.choice').css('cursor', 'pointer');
  },
  'click .choice': function(event, templateInstance){
    if (event.currentTarget.id === 'tie') {
            templateInstance.ties++
        } else {
            templateInstance.ties = 0
        }

        Meteor.call('answerRating', this._id, event.currentTarget.id, (err, data) => {
			if (templateInstance.timeToAnswer === 0) {
				// if timeToAnswer is 0 then we are in the first question
				// assign current time to timeToAnswer and proceed
				templateInstance.timeToAnswer = moment()
			} else {
				if (moment().diff(templateInstance.timeToAnswer, 'seconds') >= 5) {
					// time to answer difference between previous question and current question is > 5
					// assign new time to timeToAnswer and proceed
					templateInstance.timeToAnswer = moment()
				} else {
					// time to answer difference between previous question and current question is < 5
					// lazy answering detected so reset user's progress and assign 0 to timeToAnswer
					sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
	                Meteor.call('deleteWalletRatings', (err, data) => {})
					templateInstance.timeToAnswer = 0
				}
			}

            if (err && err.reason === 'xor') {
                if (templateInstance.cnt++ === 0) {
                    swal('Your answer is in contradiction with your previous answers. Please try again. If this persists, your progress will be purged and bounties will be nullified.')
                } else {
                    swal.error('Lazy answering detected. You\'ll have to start all over again.')
                    Meteor.call('deleteWalletRatings', (err, data) => {})

                    templateInstance.cnt = 0
                }
            }

            Cookies.set('workingBounty', false, { expires: 1 })

            if (templateInstance.ties > 10) { // ties can't be checked with XOR questions, as XOR only works on booleans. Nonetheless, if the user clicks on 'tie' 10 times in a row, it's safe to say that he/she is just lazy answering
                swal.error('Lazy answering detected. You\'ll have to start all over again.')
                Meteor.call('deleteWalletRatings', (err, data) => {})

                templateInstance.ties = 0
            }
        })
  }
});

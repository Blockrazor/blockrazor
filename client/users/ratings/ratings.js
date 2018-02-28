import { Template } from 'meteor/templating';
import { Currencies } from '../../../lib/database/Currencies.js';
import { Ratings } from '../../../lib/database/Ratings.js'
import { Bounties } from '../../../lib/database/Bounties'
import Cookies from 'js-cookie'

import '/imports/ui/stylesheets/lux.min.css';

Template.ratings.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    self.subscribe('approvedcurrencies');
    self.subscribe('ratings')
    self.subscribe('walletBounty')
  })

  this.now = new ReactiveVar(Date.now())
    Meteor.setInterval(() => {
        this.now.set(Date.now())
    }, 1000)
});

Template.displayRatings.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    self.subscribe('ratings');
  })
});

Template.question.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    self.subscribe('approvedcurrencies');
  })

  this.cnt = 0
  this.ties = 0
})

Template.currencyChoices.onCreated(function() {
  this.name = new ReactiveVar('')
  this.symbol = new ReactiveVar('')
})

Template.currencyChoice.onRendered(function () {
  var instance = this;
  Session.set('walletImageError',false);
  // $("#toggle" + instance.data._id).click(function(){
  //   $("#upload" + instance.data._id).toggle()
  // });
});

Template.ratings.onRendered(function(){
  this.autorun(function(){
    if (Template.instance().subscriptionsReady()){
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
      }else{
        $("#outstandingRatings").show();
        $("#currencyChoices").hide();
      }
    }
  })
});

Template.ratings.events({
  'click #elo': function() {
      Meteor.call('tabulateElo');
  },
  'click #wallets': function() {
      Meteor.call('averageElo', 'wallet');
  },
  'click #js-cancel': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('deleteNewBountyClient', 'new-wallet', (err, data) => {})
        Cookies.set('workingBounty', false, { expires: 1 })

        FlowRouter.go('/')
    },
})

Template.ratings.helpers({
  activeBounty: () => {
        let bounty = Bounties.find({
            userId: Meteor.userId(),
            type: 'new-wallet',
            completed: false
        }, {
            sort: {
                expiresAt: -1
            }
        }).fetch()[0]

        return bounty && bounty.expiresAt > Date.now()
    },
    timeRemaining: () => {
        let bounty = Bounties.find({
            userId: Meteor.userId(),
            type: 'new-wallet',
            completed: false
        }, {
            sort: {
                expiresAt: -1
            }
        }).fetch()[0]
      
        return `You have ${Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60)} minutes to complete the bounty for ${Number(bounty.currentReward).toFixed(2)} (* number of questions) KZR.`;
    },
  populateUI() {
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

Template.currencyChoices.helpers({
  md5() {
    return CryptoJS.MD5('Message').toString();
  },
  alreadyAdded: () => {
    /*let dups = {}
    let alreadyAdded = WalletImages.find({createdBy: Meteor.userId()}).fetch().map(i => i.currencyId)
    alreadyAdded.forEach(i => dups[i] = dups[i] ? dups[i] + 1 : 1)
    alreadyAdded = alreadyAdded.filter(i => dups[i] === 3)*/
    let alreadyAdded = _.uniq(_.flatten(Ratings.find({
      $or: [{
        owner: Meteor.userId(),
        catagory: 'wallet'
      }, {
        owner: Meteor.userId(),
        context: 'wallet'
      }]
    }).fetch().map(i => [i.currency0Id,i.currency1Id]))) // this is a simpler solution than the one above because we're already subscribed to ratings

    return Currencies.find({
      _id: {
        $in: alreadyAdded
      }
    })
  },
  currencies: () => {
    let alreadyAdded = _.uniq(_.flatten(Ratings.find({
      $or: [{
        owner: Meteor.userId(),
        catagory: 'wallet'
      }, {
        owner: Meteor.userId(),
        context: 'wallet'
      }]
    }).fetch().map(i => [i.currency0Id,i.currency1Id])))

    return Currencies.find({
      _id: {
        $nin: alreadyAdded
      },
      currencyName: new RegExp(Template.instance().name.get(), 'ig'),
      currencySymbol: new RegExp(Template.instance().symbol.get(), 'ig')
    })
  }
})

Template.currencyChoices.events({
  'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
    event.preventDefault()

    templateInstance[$(event.currentTarget).context.id.substring(3)].set($(event.currentTarget).val())
  },
  'click #populateRatings': function(){
    Meteor.call('populateRatings', function(error,result){
      if(error){
        console.log(error.reason);
      } else {
        // there's no need to reload the page, everything is reactive now
        // window.location.reload();
        if (!Ratings.findOne({
          $or: [{
            answered: false,
            catagory: 'wallet'
          }, {
            answered: false,
            context: 'wallet'
          }]
        })) {
          sAlert.error('Please uplaod some wallet images to continue.')
        }
      }
    })
  }
});

Template.displayRatings.helpers({
  questions(){
    return Ratings.findOne({
      $or: [{
        answered: false,
        catagory: 'wallet'
      }, {
        answered: false,
        context: 'wallet'
      }]
    });
  }
});

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
            if (err && err.reason === 'xor') {
                if (templateInstance.cnt++ === 0) {
                    sAlert.error('Your answer is in contradiction with your previous answers. Please try again. If this persists, your progress will be purged and bounties will be nullified.')
                } else {
                    sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
                    Meteor.call('deleteWalletRatings', (err, data) => {})

                    templateInstance.cnt = 0
                }
            }

            Cookies.set('workingBounty', false, { expires: 1 })

            if (templateInstance.ties > 10) { // ties can't be checked with XOR questions, as XOR only works on booleans. Nonetheless, if the user clicks on 'tie' 10 times in a row, it's safe to say that he/she is just lazy answering
                sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
                Meteor.call('deleteWalletRatings', (err, data) => {})

                templateInstance.ties = 0
            }
        })
  }
});

Template.upload.helpers({
    walletImageError(){
    return Session.get('walletImageError');
  }
});


Template.upload.events({
  'change input': function(event){
   var instance = this;
   var file = event.target.files[0];
   var uploadError = false;

  //check if filesize of image exceeds the global limit
  if (file.size > _walletFileSizeLimit) {
      Session.set('walletImageError','Image must be under 2mb');
      uploadError = true;
  }

 if(!_supportedFileTypes.includes(file.type)){
      Session.set('walletImageError','File must be an image');
      uploadError = true;
  }

//Only upload if above validation are true
if(!uploadError){
   var reader = new FileReader();
   reader.onload = function(fileLoadEvent){
     
     var binary = reader.result;
     var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();

     Meteor.call('uploadWalletImage', file.name, event.target.id, instance._id, reader.result, md5, function(error, result){
       if(error){
        console.log(error)
    sAlert.error(error.message);
       }else{

    sAlert.success('Upload Success');

       }

     });
   }
   reader.readAsBinaryString(file);
 }
}
});

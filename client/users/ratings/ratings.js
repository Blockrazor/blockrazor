import { Template } from 'meteor/templating';
import { Currencies } from '../../../lib/database/Currencies.js';
import { Ratings } from '../../../lib/database/Ratings.js';

Template.ratings.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    self.subscribe('approvedcurrencies');
    self.subscribe('ratings')
  })
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
})

Template.currencyChoices.onCreated(function() {
  this.name = new ReactiveVar('')
  this.symbol = new ReactiveVar('')
})

Template.currencyChoice.onRendered(function () {
  var instance = this;
  $("#toggle" + instance.data._id).click(function(){
    $("#upload" + instance.data._id).toggle()
  });
});

Template.ratings.onRendered(function(){
  this.autorun(function(){
    if (Template.instance().subscriptionsReady()){
      var count = Ratings.find({
        answered: false,
        catagory: 'wallet'
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
      Meteor.call('averageEloWallet');
  }
})

Template.ratings.helpers({
  populateUI() {
  },
  outstandingRatings() {
    var count = Ratings.find({
      answered: false,
      catagory: 'wallet'
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
    let alreadyAdded = _.uniq(_.flatten(Ratings.find({owner: Meteor.userId(),catagory: 'wallet'}).fetch().map(i => [i.currency0Id,i.currency1Id]))) // this is a simpler solution than the one above because we're already subscribed to ratings

    return Currencies.find({
      _id: {
        $in: alreadyAdded
      }
    })
  },
  currencies: () => {
    let alreadyAdded = _.uniq(_.flatten(Ratings.find({owner: Meteor.userId(), catagory: 'wallet'}).fetch().map(i => [i.currency0Id,i.currency1Id])))

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
          answered: false,
          catagory: 'wallet'
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
      answered: false,
      catagory: 'wallet'
    });
  }
});

Template.question.helpers({
  currency0Name(){
    return Currencies.findOne({_id: this.currency0Id}).currencyName
  },
  currency1Name(){
    return Currencies.findOne({_id: this.currency1Id}).currencyName
  }
});

Template.question.events({
  'mouseover .choice': function(){
    $('.choice').css('cursor', 'pointer');
  },
  'click .choice': function(event){
    Meteor.call('answerRating', this._id, event.currentTarget.id);
  }
});

Template.upload.events({
  'change input': function(event){
   var instance = this;
   var file = event.target.files[0];
   var uploadError = false;

  //check if filesize of image exceeds the global limit
  if (file.size > _walletFileSizeLimit) {
      sAlert.error("Image must be under 2mb");
      uploadError = true;
  }

 if(!_supportedFileTypes.includes(file.type)){
      sAlert.error("File must be an image");
      uploadError = true;
  }

//Only upload if above validation are true
if(!uploadError){
   var reader = new FileReader();
   reader.onload = function(fileLoadEvent){
     //var binary = event.target.result;
     var binary = reader.result;
     var md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString();
     console.log(md5);
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

import { Template } from 'meteor/templating'
import { Currencies, Ratings, WalletImages } from '/imports/api/indexDB.js'
import('sweetalert2').then(swal => window.swal = swal.default)

import './currencyChoices.html'


Template.currencyChoices.onCreated(function() {
  this.name = new ReactiveVar('')
  this.symbol = new ReactiveVar('')
})


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
    //sometimes the tooltip init is not done causing tooltips to break, lets init them again just in case.
'click .currencyChoiceBtn': function(event) {
    $('a[data-toggle="tooltip"]').tooltip({
        placement: 'right',
        html: true
    });

},
    'click button': function(){
   Session.set('walletImageError',false);
   Session.set('walletImageSuccess',false);
    },
  'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
    event.preventDefault()

    templateInstance[$(event.currentTarget).context.id.substring(3)].set($(event.currentTarget).val())
  },
  'click #populateRatings': function() {
    Meteor.call('populateRatings', function(error, result) {
        if (error) {
            console.log(TAPi18n.__(error.reason));
        } else {

            let walletsAdded = Ratings.find({
                $or: [{
                    answered: false,
                    catagory: 'wallet'
                }, {
                    answered: false,
                    context: 'wallet'
                }]
            }).count();

            //check if three files have been uploaded
            let walletCheckCount = WalletImages.find({ createdBy: Meteor.userId(), allImagesUploaded: true }).count();

            if (!walletCheckCount) {
                swal({
                    icon: "error",
                    text: TAPi18n.__('wallet.please_upload_2'),
                    confirmButtonClass: 'btn btn-primary'
                });
            } else if (walletCheckCount >= 3 && walletCheckCount < 6) {
                swal({
                    icon: "error",
                    text: TAPi18n.__('wallet.please_upload_1'),
                    confirmButtonClass: 'btn btn-primary'
                });
            } else {
				swal({
                    icon: "warning",
					title: TAPi18n.__('codebase.detect'),
                    text: _lazyAnsweringWarningText,
                    confirmButtonClass: 'btn btn-primary'
                });
            }

        }
    })
}
});

import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties, Communities } from '/imports/api/indexDB.js';
import { saveCommunity } from '/imports/api/communities/methods' //to access our validatedMethod is must be imported

import Cookies from 'js-cookie'

import './commCurrencyChoices.html';

Template.commCurrencyChoices.onCreated(function() {
    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')
})
Template.commCurrencyChoices.helpers({
    //check if the user has uploaded any images for the community.
      uploaded(id) {
      var imageUploadCount = Communities.find({ currencyId: id, createdBy: Meteor.userId() }).count();
      return imageUploadCount;

  },
    alreadyAdded: () => {
        let alreadyAdded = _.uniq(_.flatten(Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                catagory: 'community'
            }, {
                owner: Meteor.userId(),
                context: 'community'
            }]
        }).fetch().map(i => [i.currency0Id, i.currency1Id])))

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
                catagory: 'community'
            }, {
                owner: Meteor.userId(),
                context: 'community'
            }]
        }).fetch().map(i => [i.currency0Id, i.currency1Id])))

        return Currencies.find({
            _id: {
                $nin: alreadyAdded
            },
            currencyName: new RegExp(Template.instance().name.get(), 'ig'),
            currencySymbol: new RegExp(Template.instance().symbol.get(), 'ig')
        })
    },
    questions: () => {
        return Ratings.findOne({
            $or: [{
                answered: false,
                catagory: 'community'
            }, {
                answered: false,
                context: 'community'
            }]
        })
    },
    currency0Name: function() {
        return Currencies.findOne({
            _id: this.currency0Id
        }).currencyName
    },
    currency1Name: function() {
        return Currencies.findOne({
            _id: this.currency1Id
        }).currencyName
    }
})

Template.commCurrencyChoices.events({
    'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
        event.preventDefault()

        templateInstance[event.currentTarget.id.substring(3)].set($(event.currentTarget).val())
    },
    'click #populateRatings': (event, templateInstance) => {
        Meteor.call('populateCommunityRatings', (err, result) => {
            if (err) {
                sAlert.error(TAPi18n.__(err.reason))
            } else {
                if (!Ratings.findOne({
                        $or: [{
                            answered: false,
                            catagory: 'community'
                        }, {
                            answered: false,
                            context: 'community'
                        }]
                    })) {
                    sAlert.error(TAPi18n.__('communities.add'))
                }
            }
        })
    },
    'click #js-cancel': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('deleteNewBountyClient', 'new-community', (err, data) => {})
        Cookies.set('workingBounty', false, { expires: 1 })

        FlowRouter.go('/')
    },
    'click .js-save': function(event, templateInstance) {

        //Define all attributes you would like to send to the ValidatedMethod
        var params = {
            currencyId: this._id,
            url: $(`#js-com-url_${this._id}`).val(), 
            image: $('#js-image_'+event.target.id).val()
        }
        
        //Very similar to Meteor.call, not much explanation needed.
        saveCommunity.call(params, (err, data)=>{
            if (!err) {
                //ValidatedMethod is a success, perform any callback actions here
                $(`#js-com-url_${this._id}`).attr('disabled', 'true')
                $(event.currentTarget).attr('disabled', 'true')
                $(event.currentTarget).text('Saved.')

                setTimeout(() => $(`#links_${this._id}`).fadeOut( "slow"), 1000)

            } else {
               //ValidatedMethod errors will be returned here, display in console or return to user
                console.log(err, "reason", err.reason)

                sAlert.error(TAPi18n.__(err.reason))
            }
        })
    },
    'change .uploadInput': (event, templateInstance) => {
        let file = event.target.files[0]
        let uploadError = false
        let mimetype = mime.lookup(file)
        let fileExtension = mime.extension(file.type)
        let id = event.target.id;


        if (file.size > _defaultFileSizeLimit) {
            sAlert.error(TAPi18n.__('communities.image_big'))
            uploadError = true
        }

        if (!_supportedFileTypes.includes(file.type)) {
            sAlert.error(TAPi18n.__('communities.must_be_image'))
            uploadError = true
        }

        if (file) {
            $('#uploadLabel_'+id).removeClass('btn-success');
            $('#uploadLabel_'+id).addClass('btn-primary');
            $("button").attr("disabled", "disabled"); //disable all buttons
            $(".uploadText_"+id).html(`<i class='fa fa-circle-o-notch fa-spin'></i> ${TAPi18n.__('communities.uploading')}`); //show upload progress


            //Only upload if above validation are true
            if (!uploadError) {
                let reader = new FileReader()
                reader.onload = fEvent => {
                    let binary = reader.result
                    let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()
                    $('#js-image_'+id).val(`${md5}.${fileExtension}`)

                    Meteor.call('uploadCommunityPicture', file.name, reader.result, md5, (error, result) => {
                        if (error) {
                            sAlert.error(error.message);
                            $('#uploadLabel_'+id).removeClass('btn-success');
                            $('#uploadLabel_'+id).addClass('btn-primary');
                            $('.uploadText_'+id).html(TAPi18n.__('communities.upload'));
                        } else {
                            
                            $("button").attr("disabled", false); //enable all buttons
                            $('#uploadLabel_'+id).addClass('btn-success');
                            $('.uploadText_'+id).html(TAPi18n.__('communities.change')); //update button text now upload is complete

                        }
                    })
                }
                reader.readAsBinaryString(file)
            }
        }
    }

})
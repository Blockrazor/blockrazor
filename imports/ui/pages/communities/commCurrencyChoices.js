import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie'

import './commCurrencyChoices.html';

Template.commCurrencyChoices.onCreated(function() {
  this.name = new ReactiveVar('')
  this.symbol = new ReactiveVar('')
})

Template.commCurrencyChoices.helpers({
    alreadyAdded: () => {
        let alreadyAdded = _.uniq(_.flatten(Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                catagory: 'community'
            }, {
                owner: Meteor.userId(),
                context: 'community'
            }]
        }).fetch().map(i => [i.currency0Id,i.currency1Id])))

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
        }).fetch().map(i => [i.currency0Id,i.currency1Id])))

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
                sAlert.error(err.reason)
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
                    sAlert.error('Please add some communities to continue.')
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
        Meteor.call('saveCommunity', this._id, $(`#js-com-url_${this._id}`).val(), (err, data) => {
            if (!err) {
                $(`#js-com-url_${this._id}`).attr('disabled', 'true')
                $(event.currentTarget).attr('disabled', 'true')
                $(event.currentTarget).text('Saved.')

                setTimeout(() => $(`#links_${this._id}`).hide(), 1000)
            } else {
                sAlert.error(err.reason)
            }
        })
    }
})

import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie'

import './codCurrencyChoices.html'

Template.codCurrencyChoices.onCreated(function() {
    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')
})

Template.codCurrencyChoices.helpers({
    alreadyAdded: () => {
        let alreadyAdded = _.uniq(_.flatten(Ratings.find({
            $or: [{
                owner: Meteor.userId(),
                catagory: 'codebase'
            }, {
                owner: Meteor.userId(),
                context: 'codebase'
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
                catagory: 'codebase'
            }, {
                owner: Meteor.userId(),
                context: 'codebase'
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
                catagory: 'codebase'
            }, {
                answered: false,
                context: 'codebase'
            }]
        })
    }
})


Template.codCurrencyChoices.events({
    'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
        event.preventDefault()

        templateInstance[event.currentTarget.id.substring(3)].set($(event.currentTarget).val())
    },
    'click #populateRatings': (event, templateInstance) => {
        Meteor.call('populateCodebaseRatings', (err, result) => {
            if (err) {
                sAlert.error(TAPi18n.__(err.reason))
            } else {
                if (!Ratings.findOne({
                    $or: [{
                        answered: false,
                        catagory: 'codebase'
                    }, {
                        answered: false,
                        context: 'codebase'
                    }]
                })) {
                    sAlert.error(TAPi18n.__('codebase.add_codebases'))
                }
            }
        })
    },
    'click .js-save': function(event, templateInstance) {
        Meteor.call('saveCodebase', this._id, $(`#js-cod-url_${this._id}`).val(), (err, data) => {
            if (!err) {
                $(`#js-cod-url_${this._id}`).attr('disabled', 'true')
                $(event.currentTarget).attr('disabled', 'true')
                $(event.currentTarget).text(TAPi18n.__('codebase.saved'))

                setTimeout(() => $(`#links_${this._id}`).hide(), 1000)
            } else {
                sAlert.error(TAPi18n.__(err.reason))
            }
        })
    }
})

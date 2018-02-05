import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';

Template.decentralization.onCreated(function() {
    this.autorun(() => {
        this.subscribe('approvedcurrencies')
        this.subscribe('ratings')
    })

    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')

    this.selected = new ReactiveVar([])
})

Template.decentralization.onRendered(function() {
    this.autorun(function() {
        if (Template.instance().subscriptionsReady()) {
            const count = Ratings.find({
                answered: false,
                catagory: 'decentralization'
            }).count()

            $('#outstandingRatings').toggle(!!count)
            $('#currencyChoices').toggle(!count)
        }
    })
})

Template.decentralization.events({
    'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
        event.preventDefault()

        templateInstance[event.currentTarget.id.substring(3)].set($(event.currentTarget).val())
    },
    'click #populateRatings': (event, templateInstance) => {
        Meteor.call('populateDecentralizationRankings', templateInstance.selected.get(), (err, result) => {
            if (err) {
                sAlert.error(err.reason)
            } else {
                if (!Ratings.findOne({
                    answered: false,
                    catagory: 'decentralization'
                })) {
                    sAlert.error('Please select some currencies to continue.')
                }
            }
        })
    },
    'mouseover .choice': (event, templateInstance) => {
        $('.choice').css('cursor', 'pointer')
    },
    'click .choice': function(event, templateInstance) {
        Meteor.call('answerDecentralizationRanking', this._id, event.currentTarget.id, (err, data) => {})
    },
    'click .toggle': function(event, templateInstance) {
        $(`#links_${this._id}`).toggle()

        let sel = templateInstance.selected.get()

        if (!~sel.indexOf(this._id)) {
            sel.push(this._id)
        } else {
            sel = sel.filter(i => i !== this._id)
        }

        templateInstance.selected.set(sel)
    }
})

Template.decentralization.helpers({
    outstandingRatings: () => {
        return Ratings.find({
            answered: false,
            catagory: 'decentralization'
        }).count()
    },
    alreadyAdded: () => {
        let alreadyAdded = _.uniq(Ratings.find({
            owner: Meteor.userId(),
            catagory: 'decentralization'
        }).fetch().map(i => i.currency0Id))

        return Currencies.find({
            _id: {
                $in: alreadyAdded
            }
        })
    },
    currencies: () => {
        let alreadyAdded = _.uniq(Ratings.find({
            owner: Meteor.userId(),
            catagory: 'decentralization'
        }).fetch().map(i => i.currency0Id))

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
            answered: false,
            catagory: 'decentralization'
        })
    },
    currency0Name: function() {
        return Currencies.findOne({
            _id: this.currency0Id
        }).currencyName
    }
})

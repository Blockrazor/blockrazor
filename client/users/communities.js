import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';

Template.communities.onCreated(function() {
    this.autorun(() => {
        this.subscribe('approvedcurrencies')
        this.subscribe('ratings')
    })

    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')
})

Template.communities.onRendered(function() {
    this.autorun(function() {
        if (Template.instance().subscriptionsReady()) {
            const count = Ratings.find({
                answered: false,
                catagory: 'community'
            }).count()

            $('#outstandingRatings').toggle(!!count)
            $('#currencyChoices').toggle(!count)
        }
    })
})

Template.communities.events({
    'click #elo': (event, templateInstance) => {
        Meteor.call('tabulateElo', (err, data) => {})
    },
    'click #communities': (event, templateInstance) => {
        Meteor.call('averageEloCommunity', (err, data) => {})
    },
    'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
        event.preventDefault()

        templateInstance[$(event.currentTarget).context.id.substring(3)].set($(event.currentTarget).val())
    },
    'click #populateRatings': (event, templateInstance) => {
        Meteor.call('populateCommunityRatings', (err, result) => {
            if (err) {
                sAlert.error(err.reason)
            } else {
                if (!Ratings.findOne({
                    answered: false,
                    catagory: 'community'
                })) {
                    sAlert.error('Please add some communities to continue.')
                }
            }
        })
    },
    'mouseover .choice': (event, templateInstance) => {
        $('.choice').css('cursor', 'pointer')
    },
    'click .choice': function(event, templateInstance) {
        Meteor.call('answerCommunityRating', this._id, event.currentTarget.id, (err, data) => {})
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
    },
    'click .toggle': function(event, templateInstance) {
        $(`#links_${this._id}`).toggle()
    }
})

Template.communities.helpers({
    outstandingRatings: () => {
        return Ratings.find({
            answered: false,
            catagory: 'community'
        }).count()
    },
    alreadyAdded: () => {
        let alreadyAdded = _.uniq(_.flatten(Ratings.find({
            owner: Meteor.userId(),
            catagory: 'community'
        }).fetch().map(i => [i.currency0Id,i.currency1Id])))

        return Currencies.find({
            _id: {
                $in: alreadyAdded
            }
        })
    },
    currencies: () => {
        let alreadyAdded = _.uniq(_.flatten(Ratings.find({
            owner: Meteor.userId(),
            catagory: 'community'
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
            answered: false,
            catagory: 'community'
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

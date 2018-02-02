import { Template } from 'meteor/templating';
import { Currencies } from '../../lib/database/Currencies.js';
import { Ratings } from '../../lib/database/Ratings.js';

Template.codebase.onCreated(function() {
    this.autorun(() => {
        this.subscribe('approvedcurrencies')
        this.subscribe('ratings')
    })

    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')

    this.proofs = new ReactiveVar([1])
})

Template.codebase.onRendered(function() {
    this.autorun(function() {
        if (Template.instance().subscriptionsReady()) {
            const count = Ratings.find({
                answered: false,
                catagory: 'codebase'
            }).count()

            $('#outstandingRatings').toggle(!!count)
            $('#currencyChoices').toggle(!count)
        }
    })
})

Template.codebase.events({
    'click #js-add': (event, templateInstance) => {
        let proofs = templateInstance.proofs.get()
        proofs.push(proofs.length + 1)
        templateInstance.proofs.set(proofs)
    },
    'click #js-apply': (event, templateInstance) => {
        let proofs = []

        $('.proof').each((ind, i) => proofs.push({
            service: $(i).find('.js-service').val(),
            profile: $(i).find('.js-profile').val()
        }))

        proofs = proofs.filter(i => !!i.service && !!i.profile)

        if (proofs.length > 0) {
            Meteor.call('applyDeveloper', proofs, (err, data) => {
                if (!err) {
                    sAlert.info('Thank you. You\'ll see when you\'re approved.')
                } else {
                    sAlert.error(err.reason)
                }
            })
        } else {
            sAlert.error('You have to add at least on profile.')
        }
    },
    'click #elo': (event, templateInstance) => {
        Meteor.call('tabulateElo', (err, data) => {})
    },
    'click #codebase': (event, templateInstance) => {
        Meteor.call('averageElo', 'codebase', (err, data) => {})
    },
    'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
        event.preventDefault()

        templateInstance[event.currentTarget.id.substring(3)].set($(event.currentTarget).val())
    },
    'click #populateRatings': (event, templateInstance) => {
        Meteor.call('populateCodebaseRatings', (err, result) => {
            if (err) {
                sAlert.error(err.reason)
            } else {
                if (!Ratings.findOne({
                    answered: false,
                    catagory: 'codebase'
                })) {
                    sAlert.error('Please add some codebases to continue.')
                }
            }
        })
    },
    'mouseover .choice': (event, templateInstance) => {
        $('.choice').css('cursor', 'pointer')
    },
    'click .choice': function(event, templateInstance) {
        Meteor.call('answerCodebaseRating', this._id, event.currentTarget.id, (err, data) => {})
    },
    'click .js-save': function(event, templateInstance) {
        Meteor.call('saveCodebase', this._id, $(`#js-cod-url_${this._id}`).val(), (err, data) => {
            if (!err) {
                $(`#js-cod-url_${this._id}`).attr('disabled', 'true')
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

Template.codebase.helpers({
    proofs: () => Template.instance().proofs.get(),
    outstandingRatings: () => {
        return Ratings.find({
            answered: false,
            catagory: 'codebase'
        }).count()
    },
    alreadyAdded: () => {
        let alreadyAdded = _.uniq(_.flatten(Ratings.find({
            owner: Meteor.userId(),
            catagory: 'codebase'
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
            catagory: 'codebase'
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
            catagory: 'codebase'
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

import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie'

import './codebase.html'

Template.codebase.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('approvedcurrencies')
        SubsCache.subscribe('ratings')
        SubsCache.subscribe('codebaseBounty')
    })

    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')

    this.proofs = new ReactiveVar([1])

    this.cnt = 0
    this.ties = 0

    this.now = new ReactiveVar(Date.now())
    Meteor.setInterval(() => {
        this.now.set(Date.now())
    }, 1000)
})

Template.codebase.onRendered(function() {
    this.autorun(function() {
        if (Template.instance().subscriptionsReady()) {
            const count = Ratings.find({
                $or: [{
                    answered: false,
                    catagory: 'codebase'
                }, {
                    answered: false,
                    context: 'codebase'
                }]
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
                    $or: [{
                        answered: false,
                        catagory: 'codebase'
                    }, {
                        answered: false,
                        context: 'codebase'
                    }]
                })) {
                    sAlert.error('Please add some codebases to continue.')
                }
            }
        })
    },
    'mouseover .choice': (event, templateInstance) => {
        $('.choice').css('cursor', 'pointer')
    },
    'click #js-cancel': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('deleteNewBountyClient', 'new-codebase', (err, data) => {})
        Cookies.set('workingBounty', false, { expires: 1 })

        FlowRouter.go('/')
    },
    'click .choice': function(event, templateInstance) {
        if (event.currentTarget.id === 'tie') {
            templateInstance.ties++
        } else {
            templateInstance.ties = 0
        }

        Meteor.call('answerCodebaseRating', this._id, event.currentTarget.id, (err, data) => {
            if (err && err.reason === 'xor') {
                if (templateInstance.cnt++ === 0) {
                    sAlert.error('Your answer is in contradiction with your previous answers. Please try again. If this persists, your progress will be purged and bounties will be nullified.')
                } else {
                    sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
                    Meteor.call('deleteCodebaseRatings', (err, data) => {})

                    templateInstance.cnt = 0
                }
            }

            Cookies.set('workingBounty', false, { expires: 1 })

            if (templateInstance.ties > 10) { // ties can't be checked with XOR questions, as XOR only works on booleans. Nonetheless, if the user clicks on 'tie' 10 times in a row, it's safe to say that he/she is just lazy answering
                sAlert.error('Lazy answering detected. You\'ll have to start all over again.')
                Meteor.call('deleteCodebaseRatings', (err, data) => {})

                templateInstance.ties = 0
            }
        })
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
    activeBounty: () => {
        let bounty = Bounties.find({
            userId: Meteor.userId(),
            type: 'new-codebase',
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
            type: 'new-codebase',
            completed: false
        }, {
            sort: {
                expiresAt: -1
            }
        }).fetch()[0]
      
        return `You have ${Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60)} minutes to complete the bounty for ${Number(bounty.currentReward).toFixed(2)} (* number of questions) KZR.`;
    },
    proofs: () => Template.instance().proofs.get(),
    outstandingRatings: () => {
        return Ratings.find({
            $or: [{
                answered: false,
                catagory: 'codebase'
            }, {
                answered: false,
                context: 'codebase'
            }]
        }).count()
    },
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

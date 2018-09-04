import { Template } from 'meteor/templating';
import { Currencies, Ratings, Bounties } from '/imports/api/indexDB.js';
import Cookies from 'js-cookie'
import('sweetalert2').then(swal => window.swal = swal.default)

import './communities.html'
import './commCurrencyChoices'
import './commQuestions'

Template.communities.onCreated(function() {
    this.autorun(() => {
        SubsCache.subscribe('approvedcurrencies')
        SubsCache.subscribe('ratings')
        SubsCache.subscribe('communityBounty')
        SubsCache.subscribe('communities')
    })

    this.name = new ReactiveVar('')
    this.symbol = new ReactiveVar('')
    this.cnt = 0
    this.ties = 0

    this.now = new ReactiveVar(Date.now())
    Meteor.setInterval(() => {
        this.now.set(Date.now())
    }, 1000)
})

Template.communities.onRendered(function() {
    this.autorun(function() {
        if (Template.instance().subscriptionsReady()) {
            const count = Ratings.find({
                $or: [{
                    answered: false,
                    catagory: 'community'
                }, {
                    answered: false,
                    context: 'community'
                }]
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
        Meteor.call('averageElo', 'community', (err, data) => {})
    },
    'keyup #js-name, keyup #js-symbol': (event, templateInstance) => {
        event.preventDefault()

        templateInstance[event.currentTarget.id.substring(3)].set($(event.currentTarget).val())
    },
    'click #populateRatings': (event, templateInstance) => {
        Meteor.call('populateCommunityRatings', (err, result) => {
            if (err) {
				swal({
                    icon: "error",
                    text: TAPi18n.__(err.reason),
                    confirmButtonClass: 'btn btn-primary'
                });
            } else {
				swal({
					icon: "warning",
					title: TAPi18n.__('codebase.detect'),
					text: _lazyAnsweringWarningText,
					confirmButtonClass: 'btn btn-primary'
				}).then((value) => {
					if (!Ratings.findOne({
	                    $or: [{
	                        answered: false,
	                        catagory: 'community'
	                    }, {
	                        answered: false,
	                        context: 'community'
	                    }]
	                })) {
						swal({
		                    icon: "error",
		                    text: TAPi18n.__('communities.add_to_continue'),
		                    confirmButtonClass: 'btn btn-primary'
		                });
	                }
				});
            }
        })
    },
    'click #js-cancel': (event, templateInstance) => {
        event.preventDefault()

        Meteor.call('deleteNewBountyClient', 'new-community', (err, data) => {})
        Cookies.set('workingBounty', false, { expires: 1 })

        FlowRouter.go('/')
    },
    'click .toggle': function(event, templateInstance) {

        //hide previous community panel before opening the new one
        $('.communityAddPanel').hide();
        

        $(`#links_${this._id}`).toggle();
    }
})

Template.communities.helpers({
    activeBounty: () => {
        let bounty = Bounties.find({
            userId: Meteor.userId(),
            type: 'new-community',
            completed: false
        }, {
            sort: {
                expiresAt: -1
            }
        }).fetch()[0]
        console.log(bounty)

        return bounty && bounty.expiresAt > Date.now()
    },
    timeRemaining: () => {
        let bounty = Bounties.find({
            userId: Meteor.userId(),
            type: 'new-community',
            completed: false
        }, {
            sort: {
                expiresAt: -1
            }
        }).fetch()[0]

        return TAPi18n.__('codebase.time_left', {
            postProcess: 'sprintf',
            sprintf: [Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60), Number(bounty.currentReward).toFixed(2)]
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
    }
})

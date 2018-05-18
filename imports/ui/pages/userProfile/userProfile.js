import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { Currencies, UserData, Features, HashPower } from '/imports/api/indexDB.js'

import './userProfile.html'

const getName = (type) => {
	const o = {
		'cheating': 'Caught lazy answering rating questions',
		'bad-coin': 'Submitted an invalid cryptocurrency',
		'bad-wallet': 'Submitted an invalid wallet image',
		'comment': 'Submitted a comment that has been flagged and deleted',
		'redflags': 'Submitted a red flag that has been flagged and deleted',
		'features': 'Submitted a feature that has been flagged and deleted'
	}

	return o[type]
}

Template.userProfile.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('user', FlowRouter.getParam('slug'))
		SubsCache.subscribe('userdataSlug', FlowRouter.getParam('slug'))
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('comments')
		SubsCache.subscribe('hashpower')
	})

	this.user = new ReactiveVar()

	this.autorun(() => {
		this.user.set(Meteor.users.findOne({
			slug: FlowRouter.getParam('slug')
		}))
	})
})

Template.userProfile.events({
    'click .hashRigImage': function(event) {

    	//open modal
        $('.imageModal').modal('show');

        //get large image filename
	    let largeImage = event.target.src.replace('_thumbnail','');
	    $(".imageModalSrc").attr("src",largeImage);

    }

});

Template.userProfile.helpers({
		isYourPage() {
		    if (FlowRouter.getParam('slug') == Meteor.user().slug) {
		        return true;
		    }
		},
    balance() {
      let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
      return Number( balance.toPrecision(3) )
  	},
	hashPowerUploadDirectoryPublic: () => _hashPowerUploadDirectoryPublic,
	user: () => Template.instance().user.get(),
	val: val => val || '-',
	roles: () => {
		let roles = []

		let userData = UserData.findOne({
			_id: (Template.instance().user.get() || {})._id
		})

		if (userData) {
			if (userData.moderator) {
				roles.push('moderator')
			}

			if (userData.developer) {
				roles.push('developer')
			}
		}

		return roles.toString()
	},
	userData: () => {
		return UserData.findOne({
			_id: (Template.instance().user.get() || {})._id
		}) || {}
	},
	rating: function() {
		return ((this.mod || {}).data || {}).rating !== undefined ? `${this.mod.data.rating.toFixed(2)} (#${this.mod.data.rank})` : 'N\\A' 
	},
		HashPower: () => {
		return HashPower.find({createdBy:Template.instance().user._id})
		 
	},
	currencies: () => {
	        return Currencies.find({
	            owner: (Template.instance().user.get() || {})._id
	        }).fetch()
	    },
	    HashPowerImageThumb: (value) => {

	        var value = value.split('.')
	        return `${value[0]}_thumbnail.${value[1]}`
	    },
	    comments: () => {
	        return Features.find({
	            comment: {
	                $exists: true
	            },
	            createdBy: (Template.instance().user.get() || {})._id
	        }, {
	            sort: {
	                createdAt: -1
	            },
	            limit: 10 // show 10 lates comments
	        }).fetch()
	    },
	fixed: val => {
    val = val ? val : 0
    return val.toFixed(2) // 2 decimals
  },
	commentMeta: function() {
		// we have to find comment's parent in order to see its metadata (e.g. where it was posted)
		let depth = this.depth
		let feature = this

		// iterate by depth
		while (depth-- > 0) {
			feature = Features.findOne({
				_id: feature.parentId
			})
		}

		feature['currency'] = (Currencies.findOne({
			_id: feature.currencyId
		}) || {}).currencyName

		return feature
	},
	badThings: () => {
		let user = UserData.findOne({
			_id: (Template.instance().user.get() || {})._id
		})

		return user && user.strikes && user.strikes.map(i => ({
			date: moment(i.time).fromNow(),
			name: getName(i.type)
		}))
	}, 
	userExists: ()=>{
		return !Template.instance().user.get()
	}
})
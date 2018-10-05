import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { Currencies, UserData, Features, HashPower } from '/imports/api/indexDB.js'

import './userProfile.html'

const getName = (type) => {
	const o = {
		'cheating': TAPi18n.__('user.profile.cheating_info'),
		'bad-coin': TAPi18n.__('user.profile.bad_coin_info'),
		'bad-wallet': TAPi18n.__('user.profile.bad_wallet_info'),
		'comment': TAPi18n.__('user.profile.comment_info'),
		'redflags': TAPi18n.__('user.profile.redflag_info'),
		'features': TAPi18n.__('user.profile.features_info')
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
		SubsCache.subscribe('userdata')
	})

	this.user = new ReactiveVar()

	this.autorun(() => {
		this.user.set(Meteor.users.findOne({
			slug: FlowRouter.getParam('slug')
		}))
	})
})

Template.userProfile.events({
    'click .hashRigImage': function(event, templateInstance) {
        $('.imageModal').modal('show')

	    let largeImage = event.target.src.replace('_thumbnail', '')
	    $('.imageModalSrc').attr('src', largeImage)
    },
    'click #profilePicture': (event, templateInstance) => {
        event.preventDefault()

        $('#imageInput').click()
    },
    'change #imageInput': (event, templateInstance) => {
        let file = event.target.files[0]
        let uploadError = false
        let mimetype = mime.lookup(file)
        let fileExtension = mime.extension(file.type)

        if (file.size > _profilePictureFileSizeLimit) {
            sAlert.error(TAPi18n.__('user.edit.too_big'))
            uploadError = true
        }

        if (!_supportedFileTypes.includes(file.type)) {
            sAlert.error(TAPi18n.__('user.edit.must_be_image'))
            uploadError = true
        }

        if (file){
        	$('#uploadLabel').removeClass('btn-success')
        	$('#uploadLabel').addClass('btn-primary')
        	$('button').attr('disabled', 'disabled')
        	$('.uploadText').html(`<i class='fa fa-circle-o-notch fa-spin'></i> ${TAPi18n.__('user.edit.uploading')}`)


        	// Only upload if above validation are true
        	if (!uploadError) {
            	let reader = new FileReader()
            
            	reader.onload = fEvent => {
                	let binary = reader.result
                	let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()
                
                	Meteor.call('uploadProfilePicture', file.name, reader.result, md5, (error, result) => {
                        if (error) {
                        	sAlert.error(error.message);
                        
                        	$('#uploadLabel').removeClass('btn-success')
                        	$('#uploadLabel').addClass('btn-primary')
                        	$(".uploadText").html(TAPi18n.__('user.edit.upload'))
                    	} else {                        
                    		$('#js-image').val(`${md5}.${fileExtension}`)
                    		
                    		$('button').attr('disabled', false)
                    		$('#uploadLabel').addClass('btn-success')
                    		$('.uploadText').html(TAPi18n.__('user.edit.change'))
                    		$('#profilePicture').attr('src', `${_profilePictureUploadDirectoryPublic}${md5}_thumbnail.${fileExtension}`)
                    	}
                	})
           		}

           		reader.readAsBinaryString(file)
        	}
    	}
    }
})

Template.userProfile.helpers({
		isYourPage() {
		    if (FlowRouter.getParam('slug') == Meteor.user().slug) {
		        return true;
		    }
		},
    balance() {
		let profileUser = Template.instance().user.get()

		let balance = UserData.findOne({}, { fields: { balance: 1 } }).balance
		let profileUserData = UserData.findOne({ _id : Template.instance().user.get()._id }, { fields: { balance: 1 } })

		if (profileUserData !== undefined) {
			let balance = profileUserData.balance
			if (typeof(balance) === 'string') { return balance }
			return Number( balance.toPrecision(3) ).toFixed(11).replace(/\.?0+$/, "")
		}

		return 0
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
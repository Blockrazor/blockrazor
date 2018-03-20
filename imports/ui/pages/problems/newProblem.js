import { Template } from 'meteor/templating'
import { UserData } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/staringatlights:flow-router'

import './newProblem.html'

Template.newProblem.onCreated(function() {
	this.lastAmount = 0
})

Template.newProblem.events({
	'submit #js-form': (event, templateInstance) => {
		event.preventDefault()

		let images = $('#js-images').children('img').map(function() {
		    return $(this).attr('src').replace(`${_problemUploadDirectoryPublic}`, '')
		}).get()

		Meteor.call('newProblem', $('#js-type').val(), $('#js-header').val(), $('#js-text').val(), images, Number($('#js-amount').val()), (err, data) => {
			if (!err) {
				FlowRouter.go('/problems')
			} else {
				sAlert.error(err.reason)
			}
		})
	},
	'change #js-type': (event, templateInstance) => {
		if ($(event.currentTarget).val() === 'question') {
			this.lastAmount = Number($('#js-amount').val())

			$('#js-amount').val(0)

			$('#js-amount').prop('disabled', true)
		} else {
			$('#js-amount').prop('disabled', false)

			if (this.lastAmount) {
				$('#js-amount').val(this.lastAmount)
			}
		}
	},
	'change #imageInput': (event, templateInstance) => {
		let mime = require('mime-types')
		let file = event.target.files[0]
		let uploadError = false
		let mimetype = mime.lookup(file)
		let fileExtension = mime.extension(file.type)

		if (file) {
			if (file.size > _problemFileSizeLimit) {
		        sAlert.error('Image must be under 10mb')

		      	uploadError = true
		  	}

			if (!_supportedFileTypes.includes(file.type)) {
			 	sAlert.error('File must be an image')
			    
			    uploadError = true
			}

			//Only upload if above validation are true
			if (!uploadError) {
				$("#upload").html('<i class=\'fa fa-circle-o-notch fa-spin\'></i> Uploading')

			   	let reader = new FileReader()
			   	reader.onload = function(fileLoadEvent) {
			    	let binary = reader.result
			     	let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()

			     	Meteor.call('uploadProblemImage', file.name, reader.result, md5, (err, result) => {
			       		if (err) {
			        		sAlert.error(err.reason)

			        		$('#upload').html('Upload')
			       		} else {
			    			$("#js-images").append(`<img style="height: 50px;" src="${_problemUploadDirectoryPublic}${md5}.${fileExtension}" />`)

			       			$('#upload').html('Upload more')
			       		}
					})
			    }

			    reader.readAsBinaryString(file)
			}
		}
	}
})

Template.newProblem.helpers({
	balance: () => (UserData.findOne({
		_id: Meteor.userId()
	}) || {}).balance,
	fixed: (val) => val.toFixed(6),
})
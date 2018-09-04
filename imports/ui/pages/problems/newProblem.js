import { Template } from 'meteor/templating'
import { UserData, developmentValidationEnabledFalse } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'
import { newProblem } from '/imports/api/problems/methods'

import './newProblem.html'
import { format } from 'url';

function proceedSubmittingProblem() {
  let images = $('#js-images').children('img').map(function() {
      return $(this).attr('src').replace(`${_problemUploadDirectoryPublic}`, '')
  }).get()

  //formats and combines variable and text fields into a single fields with field title appended before each section.
  var formattedBody = ""
  var type = Template.instance().type.get()
  if (type == "question") {
    formattedBody += $('#js-text').val()
  } else if (type == "feature") {
    formattedBody += "Problem:\n\r" + $('#js-text').val() + "\n\n\rPotential Solution:\n\r" + $('#js-variable').val()
  } else {
    formattedBody += "Problem:\n\r" + $('#js-text').val() + "\n\n\rSteps to Reproduce:\n\r" + $('#js-variable').val()
  }

  var params = {type: $('#js-type').val(), header: $('#js-header').val(), text: formattedBody, images: images, bounty: Number.isNaN(Number($('#js-amount').val()))? 0: Number($('#js-amount').val())}
  newProblem.call(params, (err, data) => {
    if (!err) {
      FlowRouter.go('/problems')
    } else {
      var error = ''
      if (err.details.includes('Header')) {
        $('#js-header').addClass('is-invalid')
        error = 'header'
      } else if (error.toLowerCase().includes('text')) {
        $('#js-text').addClass('is-invalid')
        error = 'description'
      }
      $('#' + error + 'Error').show()
      $('#' + error + 'Error').text(err.details)
    }
  })
}

Template.newProblem.onCreated(function() {
	this.lastAmount = 0
	this.summaryCharsCount = new ReactiveVar(0)
	this.type = new ReactiveVar(null)
	this.typeSelected = new ReactiveVar(false)
	this.isNotQuestion = new ReactiveVar(true)
	this.problemDescriptionPrompt = new ReactiveVar("")
	this.problemSummaryPrompt = new ReactiveVar("")
	this.problemVariablePrompt = new ReactiveVar("")
  this.problemVariableTitle = new ReactiveVar("")
  this.bountyContributeMessage = new ReactiveVar("")

	//determines field placeholders and wether to show 3rd field, and when to show the other 2
	this.autorun(()=>{
		var type = this.type.get()
		if (type != null){
			this.typeSelected.set(true)
			var description = this.problemDescriptionPrompt
			var summary = this.problemSummaryPrompt
			var variable = this.problemVariablePrompt
			this.isNotQuestion.set(true)
			if (type == "question"){
				this.isNotQuestion.set(false)
				description.set(TAPi18n.__('problems.new.describe_question'))
				summary.set(TAPi18n.__('problems.new.summarize_question'))
			} else if (type == "feature"){
				description.set(TAPi18n.__('problems.new.describe_feature'))
				summary.set(TAPi18n.__('problems.new.summarize_feature'))
				variable.set(TAPi18n.__('problems.new.variable_feature'))
				this.problemVariableTitle.set(TAPi18n.__('problems.new.title_feature'))
			} else {
				//type = bug
				description.set(TAPi18n.__('problems.new.describe_bug'))
				summary.set(TAPi18n.__('problems.new.summarize_bug'))
				variable.set(TAPi18n.__('problems.new.variable_bug'))
				this.problemVariableTitle.set(TAPi18n.__('problems.new.title_bug'))
			}

		}
	})
})

Template.newProblem.events({
	'input #js-header': (event, templ) => {
		templ.summaryCharsCount.set(event.target.value.length)
	},
	'submit #js-form': (event, templ) => {
		event.preventDefault()
    // check whether user willing to donate some krazor
    if(Number($('#js-amount').val()) == 0) {
      // if not willing to donate, check whether user have kzr available in wallet
      let user = UserData.findOne({
        _id: Meteor.userId()
      }, {
        fields: { balance: 1 }
      })
      if(user && Number(user.balance) > 0) {
        // show advice modal
        $('#donationAdviceModal').modal("show")
      } else {
        proceedSubmittingProblem()
      }
    } else {
      proceedSubmittingProblem()
    }
  },
  'click #notWantToDonate': () => {
    proceedSubmittingProblem()
  },
  'click #wantToDonate': () => {
    Template.instance().bountyContributeMessage.set(TAPi18n.__('problems.new.thank_you'))
  },
	'change #js-type': (event, templ) => {
		templ.type.set(event.target.value)
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
		let file = event.target.files[0]
		let uploadError = false
		let mimetype = mime.lookup(file)
		let fileExtension = mime.extension(file.type)

		if (file) {
			if (file.size > _problemFileSizeLimit) {
		        sAlert.error(TAPi18n.__('problems.new.image_10m'))

		      	uploadError = true
		  	}

			if (!_supportedFileTypes.includes(file.type)) {
			 	sAlert.error(TAPi18n.__('problems.new.must_be_image'))

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
			        		sAlert.error(TAPi18n.__(err.reason))

			        		$('#upload').html(TAPi18n.__('problems.new.upload'))
			       		} else {
			    			$("#js-images").append(`<img style="height: 50px;" src="${_problemUploadDirectoryPublic}${md5}.${fileExtension}" />`)

			       			$('#upload').html(TAPi18n.__('problems.new.upload_more'))
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
	fixed: (val) => {
		if (typeof(val) === 'string') { return parseFloat(val).toFixed(6) }
		return val.toFixed(6)
	},
  adviceText: () => {
    switch(Template.instance().type.get()) {
      case "feature": {
        return TAPi18n.__('problems.new.advice_feature')
        break;
      }
      case "bug": {
        return TAPi18n.__('problems.new.advice_bug')
        break;
      }
    }
  }
})

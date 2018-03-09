import { Template } from 'meteor/templating';
import { FormData } from '../../../../lib/database/FormData'
import { HashHardware } from '../../../../lib/database/HashHardware'
import { HashAlgorithm } from '../../../../lib/database/HashAlgorithm'
import { HashUnits } from '../../../../lib/database/HashUnits'
import { Bounties } from '../../../../lib/database/Bounties'
import { FlowRouter } from 'meteor/staringatlights:flow-router';
import Cookies from 'js-cookie'

import validate from 'jquery-validation'

import '../../layouts/MainBody.html'
import './addHashpower.template.html'

Template.addHashpower.onRendered(function() {
    $( "form" ).validate({ //init jquery form validation
    	errorPlacement: function(error, element) {
     if (element.attr("name") == "imageInput") {

       // do whatever you need to place label where you want

         // an example
         error.insertAfter( $("#fileInfo") );

         // just another example
         $("#fileInfo").html( error );  

     } else {

         // the default error placement for the rest
         error.insertAfter(element);

     }
   },
  rules: {
    'js-pc': {
      required: true,
      number: true
    },
    'js-image': {
      required: true,
    }


  }
}); 
});


Template.addHashpower.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('formdata')
		SubsCache.subscribe('hashhardware')
		SubsCache.subscribe('hashalgorithm')
		SubsCache.subscribe('hashunits')
		SubsCache.subscribe('hashpowerBounty')
	})

	this.addHw = new ReactiveVar(false)
	this.addAlgo = new ReactiveVar(false)
	this.addUnit = new ReactiveVar(false)

	this.now = new ReactiveVar(Date.now())
	Meteor.setInterval(() => {
	    this.now.set(Date.now())
	}, 1000)
})

Template.addHashpower.helpers({
	hwDevices: () => HashHardware.find({}).fetch(),
	hwAlgo: () => HashAlgorithm.find({}).fetch(),
	units: () => HashUnits.find({}).fetch(),
	addHw: () => Template.instance().addHw.get() ? 'block' : 'none',
	addAlgo: () => Template.instance().addAlgo.get() ? 'block' : 'none',
	addUnit: () => Template.instance().addUnit.get() ? 'block' : 'none',
	activeBounty: () => {
	    let bounty = Bounties.find({
	      	userId: Meteor.userId(),
	      	type: 'new-hashpower',
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
	      	type: 'new-hashpower',
	      	completed: false
	    }, {
	      	sort: {
	        	expiresAt: -1
	      	}
	    }).fetch()[0]
	  
	    return `You have ${Math.round((bounty.expiresAt - Template.instance().now.get())/1000/60)} minutes to complete the bounty for ${Number(bounty.currentReward).toFixed(2)} KZR.`;
	}
})

Template.addHashpower.events({
	'click #js-add-hw': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.addHw.set(!templateInstance.addHw.get())
	},
	'click #js-add-algo': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.addAlgo.set(!templateInstance.addAlgo.get())
	},
	'click #js-add-unit': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.addUnit.set(!templateInstance.addUnit.get())
	},
	'click #js-add': (event, templateInstance) => {
		event.preventDefault()
			//check if file is selected
			if(!$('#imageInput').val()){
				$('#uploadLabel').addClass('btn-danger');
			}else{
				$('#uploadLabel').removeClass('btn-danger');
			}

		if($("form").valid()){




		const f = (device, algo, unit) => {
			Meteor.call('addHashpower', $('#js-hw-cat').val(), device, algo, $('#js-hr').val() || 0, unit, $('#js-pc').val(), $('#js-image').val(), (err, data) => {
				if (!err) {
        			Cookies.set('workingBounty', false, { expires: 1 }) // you can now start working on another bounty
					FlowRouter.go('/hashpower')
				} else {
					console.error(err.reason)
				}
			})
		} // to prevent redundant code, we simply create a function that will be called in both cases with a different parameter

		f($('#js-hw-new').val() || $('#js-hw-dev').val(), $('#js-algo-new').val() || $('#js-algo').val(), $('#js-unit-new').val() || $('#js-unit').val())
	}
	},
	'click #js-cancel': (event, templateInstance) => {
		event.preventDefault()

    	Meteor.call('deleteNewBountyClient', 'new-hashpower', (err, data) => {})
    	Cookies.set('workingBounty', false, { expires: 1 })

    	FlowRouter.go('/hashpower')
  	},
	'change #imageInput': (event, templateInstance) => {
  		const mime = require('mime-types')

  		let file = event.target.files[0]
  		let uploadError = false
  		let mimetype = mime.lookup(file)
  		let fileExtension = mime.extension(file.type)

  		if(file){
  			
  		
  		$('#uploadLabel').removeClass('btn-success');
  		$('#uploadLabel').addClass('btn-primary');
  		$("button").attr("disabled", "disabled"); //disable all buttons
  		$(".uploadText").html("<i class='fa fa-circle-o-notch fa-spin'></i> Uploading"); //show upload progress

	  	if (file.size > _hashPowerFileSizeLimit) {
	      	sAlert.error('Image is too big.')
	      	uploadError = true
	  	}

	 	if (!_supportedFileTypes.includes(file.type)) {
	      	sAlert.error('File must be an image.')
	      	uploadError = true
	  	}

		//Only upload if above validation are true
		if (!uploadError) {
		    let reader = new FileReader()
		    reader.onload = fEvent => {
		    	let binary = reader.result
		    	let md5 = CryptoJS.MD5(CryptoJS.enc.Latin1.parse(binary)).toString()

		    	Meteor.call('uploadHashPowerImage', file.name, reader.result, md5, (error, result) => {
		       		if (error) {
		    			sAlert.error(error.message);
		    			$('#uploadLabel').removeClass('btn-success');
  						$('#uploadLabel').addClass('btn-primary');
  						$(".uploadText").html("Upload");
		       		} else {		    			
		    			$('#js-image').val(`${md5}.${fileExtension}`)
		    		$("button").attr("disabled", false); //enable all buttons
		    		$('#uploadLabel').addClass('btn-success');
  					$(".uploadText").html("Change"); //update button text now upload is complete
		       		}
		     	})
		   }
		   reader.readAsBinaryString(file)
		}
	}
	}
})
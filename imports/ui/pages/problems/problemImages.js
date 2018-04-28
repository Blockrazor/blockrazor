import { Template } from 'meteor/templating'
import { ProblemImages } from '/imports/api/indexDB'
import { FlowRouter } from 'meteor/ostrio:flow-router-extra'

import './problemImages.html'

Template.problemImages.helpers({
    problemImages: () => Template.instance().data.images
})

Template.problemImage.helpers({
	_id: function() {
        let img = this.split('.')

        return img[0];
    },
    thumbnail: function() {
        let img = this.split('.')

        return `${img[0]}_thumbnail.${img[1]}`
    },
    problemImagesDir: () => _problemUploadDirectoryPublic
})

Template.problemImage.events({
    'click .problemImageOpen': (event, templateInstance) => {
        $(`#img_${event.currentTarget.id}`).modal('show')
    }
})

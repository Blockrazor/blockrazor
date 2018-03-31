import { Meteor } from 'meteor/meteor'
import { Summaries } from '/imports/api/indexDB.js'

Meteor.publish('summaries', slug => {
    if (!slug) {
        return Summaries.find()
    } else {
        return Summaries.find({
            currencySlug: slug
        })
    }
})
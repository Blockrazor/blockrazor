import { Meteor } from 'meteor/meteor'
import { Translations } from '../translations'

Meteor.publish('translations', () => {
    return Translations.find({})
})
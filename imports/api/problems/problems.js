import { Mongo } from 'meteor/mongo'
import { LocalizableCollection } from '../utilities'

let Problems = {}

if (!Meteor.isTest) {
	Problems = new LocalizableCollection('problems')
} else {
	Problems = new Mongo.Collection('problems')
}

export { Problems }

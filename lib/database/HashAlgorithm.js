import { Mongo } from 'meteor/mongo'
export var HashAlgorithm = new Mongo.Collection('hashalgorithm')

if (Meteor.isServer) {
 	Meteor.publish('hashalgorithm', () => HashAlgorithm.find({}))
}

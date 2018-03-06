import { Mongo } from 'meteor/mongo'
export var ProfileImages = new Mongo.Collection('profileimages')

if (Meteor.isServer) {
 	Meteor.publish('profileimages', () => ProfileImages.find({}))
}

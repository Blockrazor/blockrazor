import { Mongo } from 'meteor/mongo'
export var HashPowerImages = new Mongo.Collection('hashpowerimages')

if (Meteor.isServer) {
 	Meteor.publish('hashpowerimages', () => HashPowerImages.find({}))
}

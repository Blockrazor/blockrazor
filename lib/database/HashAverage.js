import { Mongo } from 'meteor/mongo'
export var HashAverage = new Mongo.Collection('hashaverage')

if (Meteor.isServer) {
 	Meteor.publish('hashaverage', () => HashAverage.find({}))
}

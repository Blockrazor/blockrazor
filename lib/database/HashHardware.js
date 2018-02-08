import { Mongo } from 'meteor/mongo'
export var HashHardware = new Mongo.Collection('hashhardware')

if (Meteor.isServer) {
 	Meteor.publish('hashhardware', () => HashHardware.find({}))
}

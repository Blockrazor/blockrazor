import { Mongo } from 'meteor/mongo'
export var HashUnits = new Mongo.Collection('hashunits')

if (Meteor.isServer) {
 	Meteor.publish('hashunits', () => HashUnits.find({}))
}

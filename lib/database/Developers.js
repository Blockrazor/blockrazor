import { Mongo } from 'meteor/mongo'
export var Developers = new Mongo.Collection('developers')

if (Meteor.isServer) {
 	Meteor.publish('developers', id => {
	  	if (id) {
	  		return Developers.find({
	  			userId: id,
	  			processed: false
	  		})
	  	} else {
	  		return Developers.find({
	  			processed: false
	  		})
	  	}
  	})
}

import { Mongo } from 'meteor/mongo'
export var Codebase = new Mongo.Collection('codebase')

if (Meteor.isServer) {
 	Meteor.publish('codebase', id => {
	  	if (id) {
	  		return Codebase.find({
	  			currencyId: id
	  		})
	  	} else {
	  		return Codebase.find({})
	  	}
  	})
}

import { Mongo } from 'meteor/mongo'
export var Communities = new Mongo.Collection('communities')

if (Meteor.isServer) {
 	Meteor.publish('communities', id => {
	  	if (id) {
	  		return Communities.find({
	  			currencyId: id
	  		})
	  	} else {
	  		return Communities.find({})
	  	}
  	})
}

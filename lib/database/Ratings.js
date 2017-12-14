import { Mongo } from 'meteor/mongo';
export var Ratings = new Mongo.Collection('ratings');

if(Meteor.isServer){
  Meteor.publish('ratings', function ratingsPublication() {
  return Ratings.find();
  });
}

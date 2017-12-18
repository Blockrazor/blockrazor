import { Mongo } from 'meteor/mongo';
export var Ratings = new Mongo.Collection('ratings');
export var RatingsTemplates = new Mongo.Collection('ratings_templates');

if(Meteor.isServer){
  Meteor.publish('ratings', function ratingsPublication() {
  return Ratings.find({owner: Meteor.user()._id, answered: false});
  });
}

if(Meteor.isServer){
  Meteor.publish('ratings_templates', function ratings_templatesPublication() {
  return RatingsTemplates.find();
  });
}

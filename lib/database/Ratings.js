import { Mongo } from 'meteor/mongo';
export var Ratings = new Mongo.Collection('ratings');
export var RatingsTemplates = new Mongo.Collection('ratings_templates');
export var EloRankings = new Mongo.Collection('elorankings');

if(Meteor.isServer){
  Meteor.publish('elorankings', function elorankingsPublication() {
    return EloRankings.find({});
  });
  Meteor.publish('ratings', function ratingsPublication() {
  return Ratings.find({owner: this.userId});
  })
}

if(Meteor.isServer){
  Meteor.publish('ratings_templates', function ratings_templatesPublication() {
  return RatingsTemplates.find();
  })

   Meteor.publish('addCoinQuestions', () => RatingsTemplates.find({
  	context: 'add-currency'
  }))
}

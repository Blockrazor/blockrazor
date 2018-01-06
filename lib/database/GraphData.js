import { Mongo } from 'meteor/mongo';
export const GraphData = new Mongo.Collection('graphdata');

if(Meteor.isServer) {
  Meteor.publish('graphdata', function graphdataPublication() {
  return GraphData.find();
  });
}

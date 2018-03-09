import { Meteor } from 'meteor/meteor'
import { GraphData, FormData } from '/imports/api/indexDB.js'

Meteor.publish('graphdata', function graphdataPublication() {
  return GraphData.find();
  });

Meteor.publish('formdata', function formdataPublication() {
  return FormData.find();
  });
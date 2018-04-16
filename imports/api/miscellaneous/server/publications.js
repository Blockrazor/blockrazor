import { Meteor } from 'meteor/meteor'
import { GraphData, FormData, AppLogs } from '/imports/api/indexDB.js'

Meteor.publish('graphdata', function graphdataPublication() {
  return GraphData.find();
  });

Meteor.publish('formdata', function formdataPublication() {
  return FormData.find({});
  })

Meteor.publish('applogs', (page, perPage) => AppLogs.find({}, {
	skip: (page - 1) * perPage,
	limit: perPage,
	sort: {
		date: -1
	}
}))
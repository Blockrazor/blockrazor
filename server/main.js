import { Meteor } from 'meteor/meteor';
//import * as jobs from './API_requests/github.js';

FastRender.route('/', function(){
this.subscribe('approvedcurrencies');
});

Meteor.startup(() => {
//jobs.initiate_later();
SyncedCron.start();

//jobs.print();
  // code to run on server at startup
});

import { Meteor } from 'meteor/meteor';
import { AppLogs, UserData, Bounties} from '/imports/api/indexDB.js';
import { generateBounties, createtypes, fetchHashrate } from '/imports/api/utilities'
import { Logger } from 'meteor/ostrio:logger'; 
import { LoggerMongo } from 'meteor/ostrio:loggermongo'

import '/imports/startup/server';


//import * as jobs from './API_requests/github.js';

// to prevent code duplication and redundancy, we simply export the logger so other files can use it easily
export const log = new Logger();
(new LoggerMongo(log, {
  collection: AppLogs
})).enable();


SyncedCron.add({
  name: 'Tabulate ELO values',
  schedule: function(parser) {
    return parser.text('every 10 minutes');
  },
  job: function() {
    Meteor.call('tabulateElo', (err, data) => {})
  }
}); 

// FastRender.route('/', function(){
// SubsCache.subscribe('approvedcurrencies');
// });

Meteor.startup(() => {
//jobs.initiate_later();
SyncedCron.start();
Meteor.call('convertAlgorithm', (err, data) => {})
//jobs.print();
  // code to run on server at startup
});
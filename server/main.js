import { Meteor } from 'meteor/meteor';
import { AppLogs, UserData, Bounties} from '/imports/api/indexDB.js';
import { generateBounties, createtypes, fetchHashrate } from '/imports/api/utilities'

import '/imports/startup/server'

//import * as jobs from './API_requests/github.js';


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
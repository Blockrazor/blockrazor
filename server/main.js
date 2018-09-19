import '/imports/startup/server'

SyncedCron.add({
  name: 'Tabulate ELO values',
  schedule: function (parser) {
    return parser.text('every 10 minutes');
  },
  job: function () {
    Meteor.call('tabulateElo', (err, data) => { })
  }
})

// FastRender.route('/', function(){
// SubsCache.subscribe('approvedcurrencies');
// });

Meteor.startup(() => {
  MAIL_URL = process.env.MAIL_URL
  SyncedCron.start()
  Meteor.call('convertAlgorithm', (err, data) => { })
})
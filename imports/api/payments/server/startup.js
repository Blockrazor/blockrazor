Meteor.startup(() => {
    //if (~['wallets'].indexOf(process.env.NODE_TYPE)) { // Execute the job iff NODE_TYPE environmental variable is set to 'wallets'. Adding more values to the array provides a granular control over which cronjobs should run where. If the cronjob runs on every instance, this if is not necessary. 
    SyncedCron.add({
        name: 'Get new Monero deposits',
        schedule: (parser) => parser.text('every 1 minutes'),
        job: () => Meteor.call('getNewPaymentsMonero', (err, data) => {})
    })
    //}
})
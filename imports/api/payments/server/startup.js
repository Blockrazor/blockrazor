Meteor.startup(() => {
    SyncedCron.add({
        name: 'Get new Monero deposits',
        schedule: (parser) => parser.text('every 1 minutes'),
        job: () => Meteor.call('getNewPaymentsMonero', (err, data) => {})
    })
})
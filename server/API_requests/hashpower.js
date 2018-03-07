SyncedCron.add({
	name: 'Update from hash powers',
	schedule: function(parser) {
		return parser.text('every 30 minutes')
	},
	job: function() {
		// currency name, api URL, request method (GET, POST, ...), data type (JSON, XML), unit (H/S, MH/S), field (val1.val2, val[0].val1)
    	Meteor.call('hashrateApi', 'Monero', 'https://moneroblocks.info/api/get_stats', 'get', 'json', 'h/s', 'hashrate', (err, data) => {})
    	Meteor.call('hashrateApi', 'Ethereum', 'https://www.etherchain.org/api/basic_stats', 'get', 'json', 'h/s', 'currentStats.hashrate', (err, data) => {})

    	// add your method calls here...
  	}
})


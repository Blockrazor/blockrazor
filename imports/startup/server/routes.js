const bodyParser = require('body-parser')

Picker.middleware(bodyParser.json())

Picker.route('/webhooks/pull', function(params, req, res, next) {
	Meteor.call('parseGitPull', req.body, (err, data) => {})

	res.status = 200
    res.end(JSON.stringify({
        status: 200,
        message: 'ok'
    })) // return 200 so github knows webhook was called successfully
})

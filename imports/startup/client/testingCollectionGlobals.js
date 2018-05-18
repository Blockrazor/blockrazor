import * as collections from '/imports/api/indexDB.js'

for (let a in collections) {
	if (!window[`testing${a}`]) { // don't override existing globals
		if (Meteor.isDevelopment) {
	    	window[`testing${a}`] = collections[a]
		} else {
			window[`testing${a}`] = {}
			window[`testing${a}`]['find'] = window[`testing${a}`]['findOne'] = () => {
				throw new Meteor.Error('Error.', `You can't reference testing${a} globally when in production, please dynamically import it accordingly.`)
			}
		}
	}
}
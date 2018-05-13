import * as collections from '/imports/api/indexDB.js'

for (let a in collections) {
	// console.log(window[a])
	if (!window[a]) { // don't override existing globals
		if (Meteor.isDevelopment) {
	    	window[a] = collections[a]
		} else {
			window[a] = {}
			window[a]['find'] = window[a]['findOne'] = () => {
				throw new Meteor.Error('Error.', `You can't reference ${a} globally when in production, please dynamically import it accordingly.`)
			}
		}
	}
}
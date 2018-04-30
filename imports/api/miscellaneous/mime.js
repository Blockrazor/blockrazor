const db = {
	'image/png': 'png',
	'image/gif': 'gif',
	'image/jpeg': 'jpg'
}

const dbInv = Object.keys(db).reduce((obj, key) => (obj[db[key]] = key, obj), {})

const mime = {
	lookup: file => file.type || dbInv[file.substr(file.lastIndexOf('.') + 1)] || false,
	extension: mimeType => db[mimeType] || false
}

export { mime as default }

if (Meteor.isClient) {
	window.mime = mime
}
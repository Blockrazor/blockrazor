const db = {
	'image/png': 'png',
	'image/gif': 'gif',
	'image/jpeg': 'jpg'
}

const dbInv = Object.keys(db).reduce((obj, key) => (obj[db[key]] = key, obj), {})

export const mime = {
	lookup: file => file.type || dbInv[a.substr(a.lastIndexOf('.') + 1)],
	extension: mimeType => db[mimeType] || false
}

if (Meteor.isClient) {
	window.mime = mime
}
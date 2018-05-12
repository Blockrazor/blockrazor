if (Meteor.isDevelopment) {
import *
    as
    collections
    from
    '/imports/api/indexDB.js'

    for (let a in collections) {
        window[a] = collections[a]
    }
}
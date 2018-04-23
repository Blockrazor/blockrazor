import { Communities } from '/imports/api/indexDB.js'
import { Meteor } from 'meteor/meteor'

Meteor.publish('communities', id => {
  if (id) {
    return Communities.find({
      currencyId: id
    })
  } else {
    return Communities.find({})
  }
})

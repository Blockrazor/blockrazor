import { Meteor } from 'meteor/meteor'
import { Developers, Codebase } from '/imports/api/indexDB.js'

Meteor.publish('developers', id => {
  if (id) {
    return Developers.find({
      userId: id,
      processed: false
    })
  } else {
    return Developers.find({
      processed: false
    })
  }
})

Meteor.publish('codebase', id => {
  if (id) {
    return Codebase.find({
      currencyId: id
    })
  } else {
    return Codebase.find({})
  }
})
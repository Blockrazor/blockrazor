import { Meteor } from 'meteor/meteor'
import { Features } from '/imports/api/indexDB.js'

Meteor.publish('features', function(id) {
  if(!id) {
    console.log("Features NoID");
    return Features.find();
  } else {
    console.log("Features ID: " + id);
    return Features.find({currencyId: id});
  }
})

Meteor.publish('featuresSlug', slug => Features.find({
  currencySlug: slug
}))

Meteor.publish('comments', function(id) {
  if(!id) {
    console.log("Features NoID");
    return Features.find();
  } else {
    console.log("Features ID: " + id);
    return Features.find({parentId: id});
  }
})

Meteor.publish('userComments', slug => {
  let user = Meteor.users.findOne({
    slug: slug
  })

  if (user) {
    return Features.find({
      comment: {
        $exists: true
      },
      createdBy: user._id
    })
  } else {
    return []
  }
})
export var Features = new Mongo.Collection('features');

if(Meteor.isServer) {
  Meteor.publish('features', function(id) {
    if(!id) {
      console.log("Features NoID");
      return Features.find();
    } else {
      console.log("Features ID: " + id);
      return Features.find({currencyId: id});
    }
  });

  Meteor.publish('comments', function(id) {
    if(!id) {
      console.log("Features NoID");
      return Features.find();
    } else {
      console.log("Features ID: " + id);
      return Features.find({parentId: id});
    }
  });
}


Meteor.methods({
  flag: function(id) {
    if(Meteor.user()) {
      if(_.include(Features.findOne(id).flaggedBy, Meteor.userId())) { throw new Meteor.Error('Error', 'You can only flag something once.') }
      Features.upsert(id, {
        $addToSet: {flaggedBy: Meteor.userId()},
        $inc: {flags: 1}
      });
      var flagRatio = Features.findOne(id).flags / Features.findOne(id).appealNumber;
      Features.upsert(id, {
        $set: {flagRatio}
      });
    } else {
      throw new Meteor.Error('Error', 'You must be signed in to flag something');
    }
  },
  newFeature: function(coinId, featureName) {
    if(Meteor.user()){
      if(typeof featureName != "string") { throw new Meteor.Error('Error', 'Error') }
      if(featureName.length > 140 || featureName.length < 6) {
        throw new Meteor.Error('Error', 'That name is too long or too short.')
      }
    Features.insert({
      currencyId: coinId,
      featureName: featureName,
      appeal: 5,
      appealNumber: 2,
      appealVoted: [Meteor.user()._id],
      flags: 0,
      flagRatio: 0,
      flaggedBy: [],
      commenters: [],
      createdAt: Date.now(),
      author: Meteor.user().username,
      createdBy: Meteor.user()._id
    })

  } else {throw new Meteor.Error('Error', 'You must be signed in to add a new feature')}
},

newComment: function(parentId, comment, depth) {
  if(Meteor.user()){
    if(typeof comment != "string") { throw new Meteor.Error('Error', 'Error') }
    if(typeof depth != "number") { throw new Meteor.Error('Error', 'Error') }
    if(comment.length > 140 || comment.length < 6) {
      throw new Meteor.Error('Error', 'That comment is too long or too short.')
    }
    if(_.include(Features.findOne(parentId).commenters, Meteor.userId())) {
      throw new Meteor.Error('Error', 'You are only allowed to comment once on any feature')
    }
  Features.insert({
    parentId: parentId,
    comment: comment,
    appeal: 5,
    appealNumber: 2,
    appealVoted: [Meteor.user()._id],
    flags: 0,
    flagRatio: 0,
    flaggedBy: [],
    commenters: [],
    createdAt: Date.now(),
    author: Meteor.user().username,
    createdBy: Meteor.user()._id,
    depth: depth
  });
  Features.upsert(parentId, {
    $addToSet: {commenters: Meteor.userId()}
  });

} else {throw new Meteor.Error('Error', 'You must be signed in to comment')}
}
});

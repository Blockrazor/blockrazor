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
  vote: function(id, direction) {
    if(this.userId) {
      if(_.include(Features.findOne(id).appealVoted, this.userId)) { throw new Meteor.Error('Error', 'You can only vote once.') }
      var amount = direction == "down" ? -1 : 1;
      console.log(amount);
      Features.update(id, {
        $addToSet: {appealVoted: this.userId},
        $inc: {appeal: amount, appealNumber: 1}
      });
      var rating = Features.findOne(id).appeal / Features.findOne(id).appealNumber;
      Features.upsert(id, {
        $set: {rating: rating}
      });
    } else {
      throw new Meteor.Error('Error', 'You must be signed in to rate something');
    }
  },
  flag: function(id) {
    if(this.userId) {
      if(_.include(Features.findOne(id).flaggedBy, this.userId)) { throw new Meteor.Error('Error', 'You can only flag something once.') }
      Features.upsert(id, {
        $addToSet: {flaggedBy: this.userId},
        $inc: {flags: 1}
      });
      var flagRatio = Features.findOne(id).flags / Features.findOne(id).appealNumber;
      Features.upsert(id, {
        $set: {flagRatio: flagRatio}
      });
    } else {
      throw new Meteor.Error('Error', 'You must be signed in to flag something');
    }
  },
  newFeature: function(coinId, featureName) {
    if(this.userId){
      if(typeof featureName != "string") { throw new Meteor.Error('Error', 'Error') }
      if(featureName.length > 140 || featureName.length < 6) {
        throw new Meteor.Error('Error', 'That name is too long or too short.')
      }
    Features.insert({
      currencyId: coinId,
      featureName: featureName,
      appeal: 2,
      appealNumber: 2,
      appealVoted: [this.userId],
      flags: 0,
      flagRatio: 0,
      flaggedBy: [],
      commenters: [],
      createdAt: Date.now(),
      author: Meteor.user().username,
      createdBy: this.userId,
      rating: 1
    })

  } else {throw new Meteor.Error('Error', 'You must be signed in to add a new feature')}
},

newComment: function(parentId, comment, depth) {
  if(this.userId){
    if(typeof comment != "string") { throw new Meteor.Error('Error', 'Error') }
    if(typeof depth != "number") { throw new Meteor.Error('Error', 'Error') }
    if(comment.length > 140 || comment.length < 6) {
      throw new Meteor.Error('Error', 'That comment is too long or too short.')
    }
    if(_.include(Features.findOne(parentId).commenters, this.userId)) {
      throw new Meteor.Error('Error', 'You are only allowed to comment once on any feature')
    }
  Features.insert({
    parentId: parentId,
    comment: comment,
    appeal: 2,
    appealNumber: 2,
    appealVoted: [this.userId],
    flags: 0,
    flagRatio: 0,
    flaggedBy: [],
    commenters: [],
    createdAt: Date.now(),
    author: Meteor.user().username,
    createdBy: this.userId,
    depth: depth,
    rating: 1
  });
  Features.upsert(parentId, {
    $addToSet: {commenters: this.userId}
  });

} else {throw new Meteor.Error('Error', 'You must be signed in to comment')}
}
});

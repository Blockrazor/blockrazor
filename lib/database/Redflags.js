export var Redflags = new Mongo.Collection('redflags');

if(Meteor.isServer) {
  Meteor.publish('redflags', function(id) {
    if(!id) {
      console.log("Redflags NoID");
      return Redflags.find();
    } else {
      console.log("Redflags ID: " + id);
      return Redflags.find({currencyId: id});
    }
  });

  Meteor.publish('redflagcomments', function(id) {
    if(!id) {
      console.log("Redflags NoID");
      return Redflags.find();
    } else {
      console.log("Redflags ID: " + id);
      return Redflags.find({parentId: id});
    }
  });
}


Meteor.methods({
  redFlagVote: function(id, direction) {
    if(this.userId) {
      if(_.include(Redflags.findOne(id).appealVoted, this.userId)) { throw new Meteor.Error('Error', 'You can only vote once.') }
      var amount = direction == "down" ? -1 : 1;
      console.log(amount);
      Redflags.update(id, {
        $addToSet: {appealVoted: this.userId},
        $inc: {appeal: amount, appealNumber: 1}
      });
      var rating = Redflags.findOne(id).appeal / Redflags.findOne(id).appealNumber;
      Redflags.upsert(id, {
        $set: {rating: rating}
      });
    } else {
      throw new Meteor.Error('Error', 'You must be signed in to rate something');
    }
  },
  redflag: function(id) {
    if(this.userId) {
      if(_.include(Redflags.findOne(id).flaggedBy, this.userId)) { throw new Meteor.Error('Error', 'You can only flag something once.') }
      Redflags.upsert(id, {
        $addToSet: {flaggedBy: this.userId},
        $inc: {flags: 1}
      });
      var flagRatio = Redflags.findOne(id).flags / Redflags.findOne(id).appealNumber;
      Redflags.upsert(id, {
        $set: {flagRatio: flagRatio}
      });
    } else {
      throw new Meteor.Error('Error', 'You must be signed in to flag something');
    }
  },
  newRedFlagMethod: function(coinId, data) {
    if(this.userId){
      if(typeof data != "string") { throw new Meteor.Error('Error', 'Error') }
      if(data.length > 140 || data.length < 6) {
        throw new Meteor.Error('Error', 'That name is too long or too short.')
      }
    Redflags.insert({
      currencyId: coinId,
      name: data,
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

  } else {throw new Meteor.Error('Error', 'You must be signed in to add a new red flag')}
},

redFlagNewComment: function(parentId, comment, depth) {
  console.log(parentId, comment, depth)
  if(this.userId){
    if(typeof comment != "string") { throw new Meteor.Error('Error', 'Error') }
    if(typeof depth != "number") { throw new Meteor.Error('Error', 'Error') }
    if(comment.length > 140 || comment.length < 6) {
      throw new Meteor.Error('Error', 'That comment is too long or too short.')
    }
    if(_.include(Redflags.findOne(parentId).commenters, this.userId)) {
      throw new Meteor.Error('Error', 'You are only allowed to comment once on any red flag')
    }
  Redflags.insert({
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
  Redflags.upsert(parentId, {
    $addToSet: {commenters: this.userId}
  });

} else {throw new Meteor.Error('Error', 'You must be signed in to comment')}
}
});

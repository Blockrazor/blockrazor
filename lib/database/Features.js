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
}


Meteor.methods({
  newFeature: function(coinId, featureName) {
    if(Meteor.user()){
      if(typeof featureName != "string") { throw new Meteor.Error('Error', 'Error') }
      if(featureName.length > 80 || featureName.length < 6) {
        throw new Meteor.Error('Error', 'That name is too long or too short.')
      }
    Features.insert({
      currencyId: coinId,
      featureName: featureName,
      appeal: 5,
      appealNumber: 2,
      appealVoted: [Meteor.user()._id],
      createdAt: Date.now(),
      author: Meteor.user().username,
      createdBy: Meteor.user()._id
    })

  } else {throw new Meteor.Error('Error', 'You must be signed in to add a new feature')}
}
});

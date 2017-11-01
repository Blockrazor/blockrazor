import { Mongo } from 'meteor/mongo';
export var UserData = new Mongo.Collection('userdata');

Meteor.methods({
  getBalance: function() {
    return UserData.findOne({_id: Meteor.user()._id}).balance;
  },
  initializeUser: function() {
    if (_.size(UserData.findOne({_id: Meteor.user()._id})) == 0) {
      UserData.insert({
        _id: Meteor.user()._id,
        moderator: 0,
        balance: 0,
        approvedCurrencies: 0,
        createdTime: new Date().getTime(),
        sessionData: [{
          loggedIP: this.connection.clientAddress,
          headerData: this.connection.httpHeaders,
          time: new Date().getTime()
        }]
      })
    }
  // if(UserData.findOne({_id: Meteor.user()._id})){
  //   UserData.upsert(Meteor.user()._id, {
  //     $set: {userName: Meteor.user().username} //
  //   })
  // }


  console.log("new user login")
  console.log(Meteor.user()._id);
  }
});

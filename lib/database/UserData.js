import { Mongo } from 'meteor/mongo';
export var UserData = new Mongo.Collection('userdata');

if(Meteor.isServer) {

  Meteor.publish('isModerator', function() {
  return UserData.find({_id: this.userId},{ fields: { moderator:true } });
  })


Meteor.methods({
  getBalance: function() {
    return UserData.findOne({_id: this.userId}).balance;
  },
  initializeUser: function() {
    if (_.size(UserData.findOne({_id: this.userId})) == 0) {
      UserData.insert({
        _id: this.userId,
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
  }
});
}

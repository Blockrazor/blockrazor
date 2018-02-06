import { Mongo } from 'meteor/mongo';
export var UserData = new Mongo.Collection('userdata');

if(Meteor.isServer) {
  Meteor.publish('isDeveloper', () => UserData.find({
    _id: Meteor.userId()
  }, {
    fields: {
      developer: true
    }
  }))

  Meteor.publish('isModerator', function() {
  return UserData.find({_id: this.userId},{ fields: { moderator:true } });
  })

  Meteor.publish('userProfile', function() {
  return UserData.find({_id: this.userId},{ fields: { fullname:1,moderator:1,profilePicture:1, } });
  })


Meteor.methods({
  getBalance: function() {
    return UserData.findOne({_id: this.userId}).balance;
  },
  initializeUser: function() {
    if (_.size(UserData.findOne({_id: this.userId})) == 0) {
      let u = UserData.find({
        'sessionData.loggedIP': this.connection.clientAddress
      }).count()

      UserData.insert({
        _id: this.userId,
        moderator: 0,
        developer: false,
        balance: 0,
        approvedCurrencies: 0,
        createdTime: new Date().getTime(),
        sessionData: [{
          loggedIP: this.connection.clientAddress,
          headerData: this.connection.httpHeaders,
          time: new Date().getTime()
        }],
        flags: {
          duplicate: {
            createdIP: !!u,
            accessIP: false
          }
        }
      })
    } else {
      UserData.upsert({
        _id: this.userId
      }, {
        $push: {
          sessionData: {
            loggedIP: this.connection.clientAddress,
            headerData: this.connection.httpHeaders, // this could be a problem in the future, it's quite a big object
            time: new Date().getTime()
          }
        }
      })
    }
  }
});
}

//import { Mongo } from 'meteor/mongo';
//export var Rewards = new Mongo.Collection('rewards');
import { UserData, Currencies, Wallet, GraphData } from '/imports/api/indexDB.js';


var rewards = {
  planned: 1,
  active: 1.8
};

export var getRewardTypeOf = function(item, context) {
  if(context == "currency") {
    if(_.findWhere(item, {'tag':'proposal'})) {
      return "planned";
    } else {return "active"}
  }
};


var getRewardFor = function(itemType, creationTime) {
  if (creationTime === false) {
    return rewards[itemType];
  }
};

export var creditUserWith = function(amount, userId, reason,rewardType) {
  if(Meteor.isServer) {
    UserData.upsert({_id: userId}, {$inc: {balance: amount}});
    Wallet.insert({
      time: new Date().getTime(),
      owner: userId,
      type: "transaction",
      from: "Blockrazor",
      message: `Congratulations! You've been awarded ${amount > 0.00001 ? amount : amount.toExponential(3)} KZR for ${reason}`,
      amount: amount,
      read: false,
      rewardType: rewardType
    });
    return true;
  }
}

export var removeUserCredit = (amount, userId, reason, rewardType) => { // if we need to remove user's credit for whatever reason
  if(Meteor.isServer) {
    UserData.upsert({_id: userId}, {$inc: {balance: -amount}});
    Wallet.insert({
      time: new Date().getTime(),
      owner: userId,
      type: "transaction",
      from: "Blockrazor",
      message: `${amount} KZR has been deduced from your account for ${reason}`,
      amount: -amount,
      read: false,
      rewardType: rewardType
    });
    return true;
  }
}

const quality = (currency) => {
  let graphdata = GraphData.findOne({
    _id: 'elodata'
  }) || {}
    
  const {eloMinElo, eloMaxElo} = graphdata
  return ((currency.eloRanking || 0) - eloMinElo) / ((eloMaxElo - eloMinElo) || 1)
}

export { quality }

export var rewardCurrencyCreator = function(launchTags, owner, currencyName) {
  console.log("start to credit")
  console.log(owner)
  /*var rewardType = getRewardTypeOf(launchTags, "currency");
  console.log(rewardType);*/
  Meteor.call('getCurrentReward', owner, currencyName, (err, data) => {
    let rewardAmount = data
    console.log(data);
    let reason = "submitting " + currencyName.toString();
    console.log(reason);

    creditUserWith(rewardAmount, owner, reason);
  }) // parseFloat(getRewardFor(rewardType, false));
  
  return true;

};

export const callWithPromise = function() { // we have to transform meteor.call methods to promises in order to work with Mocha
  let method = arguments[0]
  let params = Array.from(arguments)
  params.shift()

  return new Promise((resolve, reject) => {
      Meteor.apply(method, params, (err, res) => {
          if (err) reject(err)
          resolve(res)
      })
  })
}

Meteor.methods({

  // getBalance: function() {
  //   return UserData.findOne({_id: Meteor.user()._id}).balance;
  // },

});

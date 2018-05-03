import { Meteor } from 'meteor/meteor';
import { Exchanges, Currencies } from '/imports/api/indexDB.js';

Meteor.methods({
  fetchExchanges(){
    return Exchanges.find({}).fetch()
  },
  appendExchange(exchangeId, currencyId){
    if (!Meteor.userId()){
      throw new Meteor.Error("log in")
    }
    var eId= exchangeId
    var cId= currencyId
    var exchange = Exchanges.findOne(eId)
    var currency = Currencies.findOne(cId)
    if (!exchange || !currency){
      throw new Meteor.Error("exchange or currency doesn't exist")
    }
    if (currency.exchanges && currency.exchanges.filter(x=>{x._id == eId}).length != 0){
      throw new Meteor.Error(`exchange already appended, under name ${exchange.name}`)
    }

    Currencies.update(cId, {
      $addToSet: {exchanges: {
        name: exchange.name,
        _id: eId,
        slug: exchange.slug
      } }
    })
    Exchanges.update(eId, {
      $addToSet: {currencies: {
        name: currency.currencyName,
        _id: cId,
        slug: currency.slug
      } }
    })
    return 
  },
  untagExchange(eId, cId){
    if (!Meteor.userId()){
      throw new Meteor.Error("log in")
    }
    let exchange = Exchanges.findOne(eId)
    let currency = Currencies.findOne(cId)
    if (!exchange || !currency){
      throw new Meteor.Error("exchange or currency doesn't exist")
    }
    Currencies.update(cId, {
      $pull: {exchanges: {
        name: exchange.name,
        _id: eId,
        slug: exchange.slug
      } }
    })
    Exchanges.update(eId, {
      $pull: {currencies: {
        name: currency.currencyName,
        _id: cId,
        slug: currency.slug
      } }
    })
    return 
  },
  deleteExchange(eId){
    if (!Meteor.userId()){
      throw new Meteor.Error("log in")
    }
    let exchange = Exchanges.findOne(eId)
    if (!exchange){
      throw new Meteor.Error("exchange doesn't exist")
    }
    // first untag exchange from all tagged currencies
    if (exchange.currencies.length > 0) {
      exchange.currencies.forEach(function(currency) {
        Currencies.update(currency._id, {
          $pull: {exchanges: {
            name: exchange.name,
            _id: eId,
            slug: exchange.slug
          } }
        })        
      });
    }
    // then delete exchange
    Exchanges.remove(eId);
    return 
  },
  addExchange(name){
    if (!Meteor.userId()){
      throw new Meteor.Error("log in")
    }
    
    if (Exchanges.findOne({name: name})) {
      throw new Meteor.Error("exchange exists")
    }
    
    return Exchanges.insert({
      name: name,
      curencies: [],
    })
  },
})
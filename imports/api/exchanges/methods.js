import { Meteor } from 'meteor/meteor';
import { Exchanges, Currencies, UserData } from '/imports/api/indexDB.js';

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
      throw new Meteor.Error('messages.exchanges.doesnt_exist')
    }
    if (currency.exchanges && currency.exchanges.filter(x=>{x._id == eId}).length != 0){
      throw new Meteor.Error(`messages.exchanges.already_appended`)
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
      throw new Meteor.Error('messages.login')
    }
    let exchange = Exchanges.findOne(eId)
    let currency = Currencies.findOne(cId)
    if (!exchange || !currency){
      throw new Meteor.Error('messages.exchanges.doesnt_exist')
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
    exchangeVote: function(eId, type) {
        if (!Meteor.userId()) {
            throw new Meteor.Error('Error.', 'messages.login')
        }

        let mod = UserData.findOne({
            _id: this.userId
        }, {
            fields: {
                moderator: true
            }
        })

        if (!mod || !mod.moderator) {
            throw new Meteor.Error('Error.', 'mod-only')
        }
        
        let exchange = Exchanges.findOne({
            _id: eId
        })

        if (exchange) {
            if (!(exchange.votes || []).filter(i => i.userId === this.userId).length) { // user hasn't voted yet
                Exchanges.update({
                    _id: exchange._id
                }, {
                    $inc: {
                        score: type === 'voteUp' ? 1 : -1, // increase or decrease the current score
                        [type === 'voteUp' ? 'upvotes' : 'downvotes']: 1 // increase upvotes or downvotes
                    },
                    $push: {
                        votes: {
                            userId: this.userId,
                            type: type,
                            loggedIP: (this.connection || {}).clientAddress || '0.0.0.0', // we don't want to break the simulation
                            time: new Date().getTime()
                        }
                    }
                })
            }
               
            let approveChange = Exchanges.find({
                _id: exchange._id
            }, {
                fields: {
                    score: 1,
                    upvotes: 1,
                    downvotes: 1 
                } 
            }).fetch()[0]

            // remove the proposal if the score is <= -3
            if (approveChange.score <= -3) {
                Exchanges.update({
                    _id: exchange._id
                }, {
                    $set: {
                        score: 0, // reset all vote related values
                        upvotes: 0,
                        downvotes: 0,
                        votes: [],
                        removalProposed: false
                    }
                })

                return 'not-ok'
            }

            // Delete the exchange if it the score is >= -3
            if (approveChange.score >= 3) {
                if (exchange.currencies.length > 0) {
                    // first untag exchange from all tagged currencies
                    exchange.currencies.forEach((currency) => {
                        Currencies.update({
                            _id: currency._id
                        }, {
                            $pull: {
                                exchanges: {
                                    name: exchange.name,
                                    _id: eId,
                                    slug: exchange.slug
                                }
                            }
                        })        
                    })
                }

                // then delete exchange
                Exchanges.remove({
                    _id: exchange._id
                })
                    
                return 'ok'
            }
        }
    },
    deleteExchange: (eId) => {
        if (!Meteor.userId()) {
            throw new Meteor.Error('messages.login')
        }

        let exchange = Exchanges.findOne({
            _id: eId
        })

        if (!exchange) {
            throw new Meteor.Error('messages.exchanges.doesnt_exist')
        }
   
        Exchanges.update({
            _id: exchange._id
        }, {
            $set: {
                removalProposed: true
            }
        })
  },
  addExchange(name){
    if (!Meteor.userId()){
      throw new Meteor.Error('messages.login')
    }
    
    if (Exchanges.findOne({name: name})) {
      throw new Meteor.Error('messages.exchanges.exists')
    }
    
    return Exchanges.findOne(Exchanges.insert({
      name: name,
      curencies: [],
    }))
  },
})

if (Meteor.isDevelopment) {
    Meteor.methods({
        removeExchanges: () => {
            Exchanges.remove({}) // delete all previous ones as this may cause problems
        }
    })
}
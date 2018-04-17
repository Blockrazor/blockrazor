import { Mongo } from 'meteor/mongo';
//export var Rewards = new Mongo.Collection('rewards');
import { UserData, Currencies, Wallet, GraphData, AppLogs } from '/imports/api/indexDB.js'
import { Logger } from 'meteor/ostrio:logger'; 
import { LoggerMongo } from 'meteor/ostrio:loggermongo'
// to prevent code duplication and redundancy, we simply export the logger so other files can use it easily
let log = {}

if (Meteor.isServer) {
  log = new Logger();
  (new LoggerMongo(log, {
    collection: AppLogs
  })).enable()
} else {
  log = {
    error: console.err,
    info: console.log
  }
}

export { log }

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

var formatAmount = (amount) => {
	var final = amount > 0.00001 ? amount : amount.toExponential(3);
	return Number(final).toFixed(11).replace(/\.?0+$/,"");
}

export var creditUserWith = function(amount, userId, reason,rewardType) {
  if(Meteor.isServer) {
    UserData.upsert({_id: userId}, {$inc: {balance: amount}});
    Wallet.insert({
      time: new Date().getTime(),
      owner: userId,
      type: "transaction",
      from: "Blockrazor",
      message: `Congratulations! You've been awarded some KZR for ${reason}`,
      amount: formatAmount(amount),
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
      message: `${formatAmount(amount)} KZR has been deducted from your account for ${reason}`,
      amount: formatAmount(-amount),
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

const intersection = (point, bound) => point.y > bound.top && point.y < bound.top + bound.height && point.x > bound.left && point.x < bound.left + bound.width

let inElem = []
let shown = []
const radarEvent = (chart, event, func, type) => {
  event.preventDefault()
  event.stopPropagation()

  type = type || 'click'

  let scale = chart.scale

  let clickables = ['ongoing-development', 'code-quality', 'community', 'coin-distribution', 'decentralization']

  let elem = clickables.map((i, ind) => ({
    id: i,
    width: scale._pointLabelSizes[ind].w + 20,
    height: scale._pointLabelSizes[ind].h + 20
  })) // common elements

  let fh = (scale.height - (elem[0].height * 2))

  elem[0]['top'] = 0
  elem[0]['left'] = scale.xCenter - (elem[0].width / 2) - 10

  elem[1]['top'] = scale.yCenter - (scale.height / 5)
  elem[1]['left'] = scale.width - (((scale.width - fh) / 2))

  elem[2]['top'] = fh + elem[2].height - 12
  elem[2]['left'] = scale.xCenter + (fh * 0.33) - 10

  elem[3]['top'] = elem[2]['top']
  elem[3]['left'] = scale.xCenter - (fh * 0.33) - elem[3].width - 10

  elem[4]['top'] = elem[1]['top']
  elem[4]['left'] = (scale.width - fh) / 2 - elem[4].width - 10

  elem.push({
    id: 'chart',
    width: fh - 40,
    height: fh - 40,
    top: elem[0].height + 20,
    left: (scale.width - fh) / 2 + 20
  })

  let point = {
    x: event.clientX - event.currentTarget.getBoundingClientRect().left,
    y: event.clientY - event.currentTarget.getBoundingClientRect().top
  }

  elem.forEach(elem => {
    if (intersection(point, elem)) {
      inElem[elem.id] = true

      func(elem.id, event.currentTarget.id, true)
    } else {
      if (type === 'hover' && inElem[elem.id]) {
        func(elem.id, event.currentTarget.id, false)
      }

      inElem[elem.id] = false
    }
  })
}

export { radarEvent, intersection }
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

    creditUserWith(rewardAmount, owner, reason, 'newCurrency');
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


/*
tries to receive benefits of fast-render and yet using nonreactive data from method once ready using local collection
to optimize for instances where query is changed on with every keypress
@@params
  Name: name of collection in DB,
  methodName: method to fill in local collection with
@@methods with suffix of Local: ready, find, findOne, count, populate.
*/
export class LocalizableCollection extends Mongo.Collection {
  constructor(name, methodName){
    super(name)
    this.local = new Mongo.Collection(null)
    this.current = new ReactiveVar(this)
    this.ready = !!this.local.find().count()
    //used to switch out straightforward collection for local one reactively
    this.readyDep = new Tracker.Dependency
    this.methodName = methodName
    this.populating = false //prevents from several method calls to populate data between async
  }
  readyLocal(){
    if (!this.ready) {
      this.populateLocal()
    }
    this.readyDep.depend()
    return this.ready
  }
  findLocal(query={}, proj={}){
    if (!this.ready) {
      this.populateLocal()
      this.readyDep.depend()
      return super.find(query, proj)
    } else {
      return this.local.find(query, proj)
    }
  }
  findOneLocal(query={}, proj={}){
    if (!this.ready) {
      this.populateLocal()
      this.readyDep.depend()
      return super.findOne(query, proj)
    } else {
      return this.local.findOne(query, proj)
    }
  }
  countLocal(query={}, proj={}){
    if (!this.ready) {
      this.populateLocal()
      this.readyDep.depend()
      return super.find(query, proj).count()
    } else {
      return this.local.find(query, proj).count()
    }
  }
  populateLocal(){

    if (!this.populating){
      this.populating = true
      if(this.methodName){
      Meteor.call(this.methodName, (err, res) => {
        res.forEach(x => {
          this.local.insert(x)
        })
        this.ready = true
        this.readyDep.changed()
      })
    }
      return this.ready
    } else {
      return this.ready
    }
  }
  //careful about updating this as it will be used within server
  //permits optimistic UI using local methods
  update(selector, update){
    if (this.ready) {
      this.local.update(selector, update)
    }
    return super.update(selector, update)
  }
  insert(update){
    if (this.ready) {
      this.local.insert(update)
    }
    return super.insert(update)
  }
  //update local collection on change of liver query
  //is the same as findOne
  find(selector={}, projection={}){
    // var query = findOne? super.findOne: super.find
    if (Meteor.isClient) {
      if (!this.ready) {
        return super.find(selector, projection)
      } else {
          var res = super.find(selector, projection)
          var self = this
          //if called within tracker begins observing query and destroys it once the tracker that called is invalidated
          if (Tracker.active){
          var computation = Tracker.currentComputation
          var observeHandle = res.observeChanges({
            changed(id, fields){
              self.local.update(id, {$set: fields})
            },
            added(id, fields){
              self.local.upsert(id, {$set: Object.assign({_id: id}, fields)})
            }, 
            removed(id){
              self.local.remove(id)
            }
          })
          computation.onInvalidate(function(){
            observeHandle.stop()
          })
        }
          return res
      }
    } else {
      return super.find(selector, projection)
    }
  }
  //fetch() isn't a colleciton method so comment below doesn't happen
  //updates local collection if find was used non-reactively and thus passed without observer and local collection is in use
  findOne(selector={}, projection={}){
        if (Meteor.isClient) {
          if (!this.ready) {
            return super.findOne(selector, projection)
          } else {
            var res = super.findOne(selector, projection)
            if (res) {
              this.local.update(res._id, res)
            }
              return res
          }
        } else {
          return super.findOne(selector, projection)
        }
  }
}

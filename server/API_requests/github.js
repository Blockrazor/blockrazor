import { Currencies, AppLogs } from '/imports/api/indexDB.js';
import { MetaCurrency } from '../serverdb/metacurrency.js';
import { HTTP } from 'meteor/http'
import { log } from '/imports/api/utilities'

SyncedCron.add({
  name: 'Update from CoinMarketCap',
  schedule: function(parser) {
    return parser.text('every 5 minutes');
  },
  job: function() {
    Meteor.call('updateMarketCap');
  }
}); 

SyncedCron.add({
  name: 'Update from Github',
  schedule: function(parser) {
    return parser.text('every 1 days');
  },
  job: function() {
    console.log("start github doogle update");
    var time = new Date().getTime() / 1000;
    var allcurrencies = Currencies.find({}, { sort: { createdAt: -1 }}).fetch();
    for (var i in allcurrencies) {
      if (allcurrencies[i].gitRepo) {
        let gitAPI = `https://api.github.com/repos/${allcurrencies[i].gitRepo.replace(/((http|https):\/\/)?github.com\//, '').replace(/\/+$/, '')}/stats/participation` 
    
        if (allcurrencies[i].gitUpdate + 604700 < time || !allcurrencies[i].gitUpdate) {
          console.log(i + " " + gitAPI + " " + allcurrencies[i]._id)
          Meteor.call('fetchGitCommits', gitAPI, allcurrencies[i]._id, time); //https://api.github.com/repos/ethereumproject/go-ethereum/stats/participation  https://github.com/ethereumproject/go-ethereum   monero-project/monero/stats/participation
        }
      }
    }
  }
});


Meteor.methods({
  fetchGitCommits: (repo, id, time) => {
    HTTP.get(repo, {
      headers: {
        "User-Agent": "gazhayes-blockrazor"
      }
    }, (error, result) => {
      let err = false
      if (!error) {
        if (result && result.data && result.data.all) {
          // alles gut
          last4weeks = result.data.all[51] + result.data.all[50] + result.data.all[49] + result.data.all[48];
          Currencies.upsert(id, {
            $set: {
              gitCommits: last4weeks,
              gitUpdate: time
            }
          })
        } else {
          logs.error('Error when fetching git commits.', {
            id: id,
            repo: repo,
            error: 'Result not defined.'
          })

          err = true
        }
      } else {
        log.error('Error in fetchGitCommits',{
          id: id,
          repo: repo,
          error: error
        })

        err = true
      }

      if (err) { // to prevent unnecessary checks
        let count = AppLogs.find({ // get all previous
          level: 'ERROR',
          'additional.id': id,
          'additional.repo': repo
        }).count()

        if (count >= 3) { // if this happened three times, remove the git repo, apparently something is wrong
          Currencies.upsert({
            _id: id
          }, {
            $set: {
              gitRepo: ''
            }
          })
        }
      } else {
        // if the url returns results, clean out the app logs to prevent it from getting purged
        AppLogs.remove({
          level: 'ERROR',
          'additional.id': id,
          'additional.repo': repo
        })
      }
    })
  },

updateMarketCap () {
var allcurrencies = Currencies.find({}, { sort: { createdAt: -1 }}).fetch();
  HTTP.call('GET', "https://api.coinmarketcap.com/v1/ticker/", {
    }, (error, result) => {
      if (!error) {

        for (var key in result.data) {
          for (var currency in allcurrencies) {//i = 0; i < Currencies.find({}, { sort: { createdAt: -1 }}).count(); i++) {
            if (result.data[key].name.toLowerCase() == allcurrencies[currency].currencyName.toLowerCase() || result.data[key].name == allcurrencies[currency].currencySymbol) {
              console.log("Updating: " + allcurrencies[currency].currencyName)

              let price = result.data[key].market_cap_usd / result.data[key].available_supply

              Currencies.upsert(allcurrencies[currency]._id,
              {
                $set: {
                  marketCap: Math.round(result.data[key].market_cap_usd),
                  circulating: Math.round(result.data[key].available_supply),
                  price: price.toFixed(2),//.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  cpc: ((result.data[key].available_supply / 100000000) * price).toFixed(2),
                  cpt: (((allcurrencies[currency].maxCoins || 0) / 100000000) * price).toFixed(2), // just to be safe
                }
              })
            }
          }
          // Currencies.insert({
          // currencyName: result.data[key].name,
          // currencySymbol: result.data[key].symbol,
          // circulating: Math.round(result.data[key].available_supply),
          // marketCap: Math.round(result.data[key].market_cap_usd),
          // price:   result.data[key].market_cap_usd / result.data[key].available_supply,
          // cmc_id: result.data[key].id
          // })
        }

      //for (i=0;)


//        CMC.insert(result.data);
  //      console.log(CMC.find({},{}).fetch())
        //return result;
  //      Currencies.update({_id: currency._id}, $addToSet: {marketCap:  Math.round(result.data[0].market_cap_usd).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}, {upsert: true})
        //var insert = Math.round(result.data[0].market_cap_usd).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        //console.log("inside " + allcurrencies[x]._id)
        //console.log(result);
        //console.log("fromdb: " + allcurrencies[i].marketCap)
      } else {
        log.error('Error in updateMarketCap', error)
      }
    })


//   console.log(allcurrencies);
//   for (i = 0; i < 60; i++) {
//     if (allcurrencies[i]) {
//       console.log("2 " + allcurrencies[i]._id);
//     if (allcurrencies[i].currencyName) {
//       console.log("3 " + allcurrencies[i]._id);
//
//
//
// }}


}
})

function initiate_later () {

  var git = later.parse.cron('* * * * *'); // every 1 minute past the hour
  occur = later.schedule(git).next(10);
  var execute = later.setInterval(tellme, git);

  //    occurrences = later.schedule(git61).next(50);
}

function update_gitcommits () {
  console.log("before HTTP call");
  HTTP.call("GET", "http://slowwly.robertomurray.co.uk/delay/10000/url/http://www.google.co.uk");
  console.log("after HTTP call");

for (i = 0; i < 60; i++) {
if (allcurrencies[i]) {
if (allcurrencies[i].gitRepo) {
currenciesToUpdate.push({id:allcurrencies[i]._id, repo:allcurrencies[i].gitRepo});


//console.log(allcurrencies[i]._id + " " + allcurrencies[i].gitRepo);
}
}
}
}

function print() {console.log(currenciesToUpdate);}
export {initiate_later, update_gitcommits, print};
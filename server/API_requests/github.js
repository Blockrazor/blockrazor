import { Currencies } from '../../lib/database/Currencies.js';
import { MetaCurrency } from '../serverdb/metacurrency.js';
import { HTTP } from 'meteor/http'
import { log } from '../main'

SyncedCron.add({
  name: 'Update from CoinMarketCap',
  schedule: function(parser) {
    return parser.text('every 10 minutes');
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
      if (allcurrencies[i].gitAPI) { if (allcurrencies[i].gitUpdate + 604700 < time || !allcurrencies[i].gitUpdate) {
        console.log(i + " " + allcurrencies[i].gitAPI + " " + allcurrencies[i]._id)
        Meteor.call('fetchGitCommits', allcurrencies[i].gitAPI, allcurrencies[i]._id, time); //https://api.github.com/repos/ethereumproject/go-ethereum/stats/participation  https://github.com/ethereumproject/go-ethereum   monero-project/monero/stats/participation
      }
    }}

  }
});


Meteor.methods({

 fetchGitCommits (repo, id, time) {
    //var result = HTTP.call( 'GET', repo, {headers: {"User-Agent": "gazhayes-blockrazor"}} );
   HTTP.get(repo, {
   headers: {"User-Agent": "gazhayes-blockrazor"}},
   (error, result) => {
       if (!error) {
         last4weeks = result.data.all[51] + result.data.all[50] + result.data.all[49] + result.data.all[48];
         Currencies.upsert(id, {
           $set: {
             gitCommits: last4weeks,
             gitUpdate: time
           }
         }
         )

       } else {
        log.error('Error in fetchGitCommits', error)
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
            console.log("Updating: " + allcurrencies[currency].currencyName);
            Currencies.upsert(allcurrencies[currency]._id,
            {
              $set: {
                marketCap: Math.round(result.data[key].market_cap_usd),
                circulating: Math.round(result.data[key].available_supply),
                price:   (result.data[key].market_cap_usd / result.data[key].available_supply).toFixed(2)//.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }

            });
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

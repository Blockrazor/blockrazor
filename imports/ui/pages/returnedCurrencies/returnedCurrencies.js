import { Template } from 'meteor/templating';
import { Currencies } from '/imports/api/indexDB.js';

import scrollmagic from 'scrollmagic';
import './returnedCurrencies.html'
import './currency.js'

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('dataQualityCurrencies');
  })
  this.searchInputFilter = new ReactiveVar(undefined); 
  this.increment = 15
  this.limit = new ReactiveVar(this.increment)
  this.filter = new ReactiveVar({})
  this.countReady = new ReactiveVar(false) //used to tell wether to show count, count occurs once local collection is populated
  this.everythingLoaded = new ReactiveVar(false) //used to tell when user has reached end of the list in infinite scroll
  this.count = new ReactiveVar(100)
  this.noFeatured = new ReactiveVar(false)

  this.autorun(() => {
    this.noFeatured.set(!Currencies.findOne({
      featured: true
    }))
  })
  
  //resets limit and calculates filter parameters for query
  this.autorun(()=>{
    var templ = Template.instance()
    let searchInputFilter = templ.searchInputFilter.get();
    templ.limit.set(templ.increment)
    this.filter.set({
        $or: [{
            currencyName: { $regex: new RegExp(searchInputFilter, "i") }
        }, {
            currencySymbol: { $regex: new RegExp(searchInputFilter, "i") }
        }, {
            'previousNames.tag': new RegExp(searchInputFilter, 'gi')
        }]
    })
  })

  //calculates count, and if all records are loaded
  this.autorun(()=>{
    var templ = Template.instance()
    let count = templ.count
      let filter = templ.filter.get()
      count.set(Currencies.countLocal(filter))
      if (count.get() <= templ.limit.get()){
        templ.everythingLoaded.set(true)
      } else {
        templ.everythingLoaded.set(false)
      }
  })
  this.autorun(()=>{
    this.countReady.set(Currencies.readyLocal())
  })

});

Template.returnedCurrencies.onRendered( function () {	
	// init controller
	this.controller = new scrollmagic.Controller();
  var templ = Template.instance()
	// build scene
	 var scene = new scrollmagic.Scene({triggerElement: "#loader", triggerHook: "onEnter"})
					.addTo(templ.controller)
					.on("enter", function (e) {
             templ.limit.set(templ.limit.get()+templ.increment)
             scene.update()
          })
          
//  console.log(Currencies.findOne())
//Meteor.call('updateMarketCap');
});

Template.returnedCurrencies.helpers({
    noFeatured: () => Template.instance().noFeatured.get(),
    currencies() {
      var templ = Template.instance()
        let filter = templ.filter.get();
            return Currencies.findLocal(filter, { sort: { featured: -1, quality: -1, createdAt: -1 }, limit: templ.limit.get(), 
              fields: {  
                eloRanking: 1,
                slug: 1,  
                currencySymbol: 1,  
                marketCap: 1,  
                maxCoins: 1,  
                hashpower: 1,  
                genesisTimestamp: 1,  
                circulating: 1,  
                currencyName: 1,  
                communityRanking: 1,  
                codebaseRanking: 1,  
                walletRanking: 1,  
                decentralizationRanking: 1,  
                gitCommits: 1,  
                featured: 1,
                premine: 1,
                cpc: 1,
                cpt: 1,
                price: 1
              }
             })
    },
});

Template.returnedCurrencies.events({
  'keyup #searchInput': function(event) {
    event.preventDefault();
    let query = $('#searchInput').val();
    
    //clear filter if no value in search bar
    if(query.length<1){
      Template.instance().searchInputFilter.set(undefined);
    }
    
    if(query){
     Template.instance().searchInputFilter.set(query); //done
    }

  }, 
})

Template.returnedCurrencies.onDestroyed( function () {	
  // destroys scenes and controller
  this.controller.destroy()
});

import { Template } from 'meteor/templating';
import { Currencies, LocalCurrencies } from '/imports/api/indexDB.js';

import scrollmagic from 'scrollmagic';
import './returnedCurrencies.html'
import './currency.js'

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('dataQualityCurrencies');
  })
  this.searchInputFilter = new ReactiveVar(undefined); 
  this.filterCount = new ReactiveVar(undefined);
  this.increment = 15
  this.limit = new ReactiveVar(this.increment)
  this.countReady = new ReactiveVar(false)
  this.filter = new ReactiveVar({})
  this.count = new ReactiveVar(undefined)
  this.everythingLoaded = new ReactiveVar(false)
  //necessery as tracker doesn't appear to recognize that collection is different (try modifying LocalCurrencies records before swap)
  this.TransitoryCollection = new ReactiveVar(Currencies)

  this.noFeatured = new ReactiveVar(false)

  this.autorun(() => {
    this.noFeatured.set(!Currencies.findOne({
      featured: true
    }))
  })

	//logic for receiving benefits of fast-render and yet using nonreactive data from method
  if (!LocalCurrencies.find().count()) {
		Meteor.call('fetchCurrencies', (err, res) => {
			res.forEach(x => {
				LocalCurrencies.insert(x)
      })
      this.countReady.set(true)
			this.TransitoryCollection.set(LocalCurrencies)
		})
	} else {
    this.countReady.set(true)
		this.TransitoryCollection.set(LocalCurrencies)
  }
  
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
    if (templ.countReady.get() == true) {
      let filter = templ.filter.get()
      templ.count.set(templ.TransitoryCollection.get().find(filter).count())
      if (typeof templ.count.get() != 'string' && templ.count.get() <= templ.limit.get()){
        templ.everythingLoaded.set(true)
      } else {
        templ.everythingLoaded.set(false)
      }
    } else {
       templ.count.set('...')
    }
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

            return templ.TransitoryCollection.get().find(filter, { sort: { featured: -1, quality: -1, createdAt: -1 }, limit: templ.limit.get(), 
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
    filterCount() {
      var templ = Template.instance()
      if (templ.countReady.get() == true) {

      //filter
      let filter = templ.filter.get()

      let filterQuestCount = templ.TransitoryCollection.get().find(filter).count()

      return filterQuestCount
    } else {
      return "..."
    }
    }
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

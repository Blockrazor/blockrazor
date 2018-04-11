import { Template } from 'meteor/templating';
import { Currencies, UsersStats, Redflags, FormData } from '/imports/api/indexDB.js';

import scrollmagic from 'scrollmagic';
import Slider from 'bootstrap-slider';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';

import './returnedCurrencies.html'
import './returnedCurrencies.scss'
import './currency.js'

import { quality } from '/imports/api/utilities'

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('dataQualityCurrencies');
    SubsCache.subscribe('usersStats')
  })
  this.searchInputFilter = new ReactiveVar(undefined); 
  this.increment = 15
  this.limit = new ReactiveVar(this.increment)
  this.filter = new ReactiveVar({})
  this.countReady = new ReactiveVar(false) //used to tell wether to show count, count occurs once local collection is populated
  this.everythingLoaded = new ReactiveVar(false) //used to tell when user has reached end of the list in infinite scroll
  this.count = new ReactiveVar(100)
  this.noFeatured = new ReactiveVar(false)
  this.securityTypes = new ReactiveVar(["Proof of Work", "Proof of Stake", "Hybrid"])
  this.fromFilter = new ReactiveVar("")
  this.toFilter = new ReactiveVar("")



  this.autorun(() => {
    SubsCache.subscribe('redflags')
    this.noFeatured.set(!Currencies.findOne({
      featured: true
    }))
  })
  
  //resets limit and calculates filter parameters for query
  this.autorun(() => {
      var templ = Template.instance()
      let searchInputFilter = templ.searchInputFilter.get();
      let securityTypes = templ.securityTypes.get();
      let fromFilter = templ.fromFilter.get()
      let toFilter = templ.toFilter.get();


      templ.limit.set(templ.increment)

      let query = {
          consensusSecurity: { $in: securityTypes },
          $or: [{
              currencyName: { $regex: new RegExp(searchInputFilter, "i") }
          }, {
              currencySymbol: { $regex: new RegExp(searchInputFilter, "i") }
          }, {
              'previousNames.tag': new RegExp(searchInputFilter, 'gi')
          }]
      }

      if (fromFilter != "" && toFilter != "") {
        query["genesisTimestamp"] = { $gte: fromFilter, $lte: toFilter }
      }
      this.filter.set(query)
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
          
//Meteor.call('updateMarketCap');
  
  // date slider
  var sliderDateStart = 1233619200000;
  var sliderDateEnd = Date.now();
  var formatter = (index) => {
    if (index.length = 2)
      return new Date(index[0]).toLocaleString([], {day:'numeric',month:'short',year:'numeric'})+' - '+new Date(index[1]).toLocaleString([], {day:'numeric',month:'short',year:'numeric'})
  }
  this.dateSlider = new Slider('.date-slider', {
    min: sliderDateStart,
    max: sliderDateEnd,
    step: 86400,              // step : 1 day
    value: [sliderDateStart,sliderDateEnd],
    formatter
  });

});

Template.returnedCurrencies.helpers({
    noFeatured: () => Template.instance().noFeatured.get(),
    currencies() {
      var templ = Template.instance()
        let filter = templ.filter.get();
            let templateVars = Currencies.findLocal(filter, { sort: { featured: -1, quality: -1, createdAt: -1 }, limit: templ.limit.get(),
              fields: {
                consensusSecurity: 1,
                _id: 1,
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
             }).fetch()

            //get top red flag value
            templateVars.forEach(templateVar => {
                let currency = Redflags.findOne({
                        currencyId: templateVar._id
                    }) || {};

                templateVar['top_red_flag'] = currency.name;
            });

            return templateVars;
    },
    onlineUsers(){
      return UsersStats.findOne("connected").connected
    },
    createdUsers(){
      return UsersStats.findOne("created").created
    },
      security () {
    return FormData.find({});
  },
});

Template.returnedCurrencies.events({
    'click .apply-filter-button': function(event, template) {
      // apply date range
      var rangeValues = template.dateSlider.getValue();
      template.fromFilter.set(rangeValues[0]);
      template.toFilter.set(rangeValues[1]);

      // apply security constraints
      var setSecurityTypes = template.$('input:checked').map(function() {
        return $(this).val();
      });
      var test = $.makeArray(setSecurityTypes);
      template.securityTypes.set(test);
    },
    'click .currencyFilter': function(event) {
        $('.currencyFilterModal').modal('show');
    },
    'keyup #searchInput': function(event) {
        event.preventDefault();
        let query = $('#searchInput').val();

        //clear filter if no value in search bar
        if (query.length < 1) {
            Template.instance().searchInputFilter.set(undefined);
        }

        if (query) {
            Template.instance().searchInputFilter.set(query); //done
        }

    },
})

Template.returnedCurrencies.onDestroyed( function () {	
  // destroys scenes and controller
  this.controller.destroy()
});

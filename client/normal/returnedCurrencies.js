import { Template } from 'meteor/templating';
import { Currencies } from '/imports/api/indexDB.js';

Template.returnedCurrencies.onCreated(function bodyOnCreated() {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('approvedcurrencies');
  })
  this.searchInputFilter = new ReactiveVar(undefined); 
  this.filterCount = new ReactiveVar(undefined);
});

Template.returnedCurrencies.onRendered( function () {
//  console.log(Currencies.findOne())
//Meteor.call('updateMarketCap');
});

Template.returnedCurrencies.helpers({
    currencies() {

        let searchInputFilter = Template.instance().searchInputFilter.get();

        //filter
        let filter = {
            $or: [{
                currencyName: { $regex: new RegExp(searchInputFilter, "i") }
            }, {
                currencySymbol: { $regex: new RegExp(searchInputFilter, "i") }
            }]
        };

        //only perform a search if searchInputFilter !=null
        if (searchInputFilter) {
            let filterQuestCount = Currencies.find(filter).count()
            if (filterQuestCount) {
                Template.instance().filterCount.set(filterQuestCount);
            } else {
                return Template.instance().filterCount.set(0);;
            }
            return Currencies.find(filter, { sort: { createdAt: -1 }, limit: 20 });
        } else {
            return Currencies.find({}, { sort: { createdAt: -1 }, limit: 20 });
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
    'click #clear': function(event) {
    event.preventDefault();
    //clear all values in filter
    $('#currencyFilter').trigger("reset");

    //set all session to undefined, its undefined as the currencies() helper checks on this
    clearSessions();

  },
  'change input': function(event) { 
    event.preventDefault(); 
    if($(event.target).val().length > 0){ 
        $(event.target).addClass('filled'); 
      } 
      else{ 
        $(event.target).removeClass('filled'); 
      } 
    } 
  })

  Template.currencyFilter.helpers({
    filterCount() {
      // Blaze's API function for cross-template communication
      return Template.instance().view.parentView.templateInstance().filterCount.get();
    }

    });

import { Template } from 'meteor/templating'
import { WalletImages } from '../../../api/indexDB.js'
import { Currencies } from '../../../api/indexDB.js'
import { GraphData } from '../../../api/indexDB.js'

import "../../components/radarGraph.js"
import './fundamentalMetrics.html'

// import '../userProfile/userHover' //is broken import //import the userHover template for later usage (we have to import it everywhere we want to use it)

Template.fundamentalMetrics.onCreated(function() {
  this.autorun(() => {
    SubsCache.subscribe('graphdata')
    SubsCache.subscribe('approvedcurrencies')
  })
})

Template.fundamentalMetrics.events({
  'click #name': function () {
    if(Template.instance().lastId.get()){document.getElementById(Template.instance().lastId.get()).style.display = "none";}
    document.getElementById(this._id).style.display = "block";
    Template.instance().lastId.set(this._id);
  }
});

Template.fundamentalMetrics.helpers({
  options: function (){
    return {
                responsive: false,
                defaultFontColor: 'red',
              tooltips: {enabled: false},
              maintainAspectRatio: false,
              title: {display: false},
              legend: {
                display: false,
                position: 'bottom',
                labels: {
                  fontColor: 'red',
                  display: true,
                }
              },
              scale: {
                pointLabels: {fontSize: 14},
    
              // Hides the scale
              display: true
          }
            }
  },
  metricDescription: function () {
    return this.metricTag; //find metricTag data from collection
  },
  metrics: function() {
    var metrics = [{
      _id: "938274n5982735498",
      currencyName: "Bitcoin",
      name: "Ongoing Development",
      commitsYear: 1245,
      commits60day: 244,
      metricTag: "ongoingDevelopment"
    },
    {
      _id: "btyreybtrebret",
      name: "Code Quality",
      commitsYear: 1245,
      commits60day: 244
    },
    {
      _id: "635756745",
      name: "Coin Distribution",
      commitsYear: 1245,
      commits60day: 244
    },
    {
      _id: "73567567",
      name: "Community",
      commitsYear: 1245,
      commits60day: 244
    }];

    return metrics;
  }
});







//
// Template.metricContent.onRendered(function (){
//   // Session.set('thisId', this.data._id);
//   // if (Session.get('lastId')) {
//   //   document.getElementById(Session.get('lastId')).style.display = "none";
//   // }
//   // document.getElementById(this.data._id).style.display = "block";
//   // Session.set('lastId', this.data._id);
// });

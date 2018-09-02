import { Template } from 'meteor/templating'
import { WalletImages } from '../../../api/indexDB.js'
import { Currencies } from '../../../api/indexDB.js'
import { GraphData } from '../../../api/indexDB.js'
import Chart from 'chart.js';

import './currency.scss'
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
      animation: {
        duration: 0
      },
      responsive:  false,
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
Template.fundamentalMetrics.onRendered(function (){
  var currencyData = Template.currentData();
  var ctx = document.getElementById("distribution").getContext('2d');
  ctx.canvas.width = 200;
  ctx.canvas.height = 260;
  var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'doughnut',
      // The data for our dataset
      data: {
          labels: [TAPi18n.__('currency.fundamental.share') + currencyData.premine, TAPi18n.__('currency.fundamental.mined') + currencyData.circulating, TAPi18n.__('currency.fundamental.not_mined') + (currencyData.maxCoins - currencyData.circulating)],
          datasets: [{
            data: [(((currencyData.premine / currencyData.maxCoins) * 100).toFixed()), ((((currencyData.circulating - currencyData.premine) / currencyData.maxCoins) * 100).toFixed()), ((((currencyData.maxCoins - currencyData.circulating)/currencyData.maxCoins) * 100).toFixed())],
            backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f"]
          }]
      },

      // Configuration options go here
      options: {
        animation: {
          duration: 0
        },
        tooltips: {enabled: false},
        responsive: false,
        maintainAspectRatio: true,
        aspectRatio: 1,
        title: {display: false},
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 15
          }
        }
      }
  });
  // Session.set('thisId', this.data._id);
  // if (Session.get('lastId')) {
  //   document.getElementById(Session.get('lastId')).style.display = "none";
  // }
  // document.getElementById(this.data._id).style.display = "block";
  // Session.set('lastId', this.data._id);
});

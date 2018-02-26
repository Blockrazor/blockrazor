import { Chart } from 'chart.js'
import { Template } from 'meteor/templating';
import { GraphData } from '../../lib/database/GraphData.js';

Template.currency.onCreated(function bodyOnCreated(){
  var self = this
  var currencyData = Template.currentData();
  self.autorun(function(){
  var subscription = self.subscribe('graphdata');

  if (Template.instance().subscriptionsReady()) {
     
       var ctx = document.getElementById(currencyData._id + "distribution").getContext('2d');
ctx.canvas.width = 200;
ctx.canvas.height = 260;
  var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'doughnut',


      // The data for our dataset
      data: {
          labels: ["Founder(s) share: " + currencyData.premine, "Mined coins: " + currencyData.circulating, "Not yet mined: " + (currencyData.maxCoins - currencyData.circulating)],
          datasets: [{
              data: [(((currencyData.premine / currencyData.maxCoins) * 100).toFixed()), ((((currencyData.circulating - currencyData.premine) / currencyData.maxCoins) * 100).toFixed()), ((((currencyData.maxCoins - currencyData.circulating)/currencyData.maxCoins) * 100).toFixed())],
              backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f"]
          }]
      },

      // Configuration options go here
      options: {
        tooltips: {enabled: false},
        responsive: false,
        maintainAspectRatio: false,
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

var radar = document.getElementById(currencyData._id + "-radar").getContext('2d');
radar.canvas.width = 400;
radar.canvas.height = 300;

let graphdata = GraphData.findOne({
  _id: 'elodata'
}) || {}
var wallet = currencyData.walletRanking / graphdata.walletMaxElo * 10;
var community = (currencyData.communityRanking || 400) / graphdata.communityMaxElo * 10;
let codebase = (currencyData.codebaseRanking || 400) / graphdata.codebaseMaxElo * 10

let maxD = graphdata.decentralizationMaxElo
let minD = graphdata.decentralizationMinElo

let decentralization = (((currencyData.decentralizationRanking || 400) - minD) / ((maxD - minD) || 1)) * 10 

let minDev = graphdata.developmentMinElo
let maxDev = graphdata.developmentMaxElo

let development = (((currencyData.gitCommits || 0) - minDev) / ((maxDev - minDev) || 1)) * 10 
var datanums = [development,codebase,community,2,7,wallet,1,3,decentralization];
  var radarchart = new Chart(radar, {
      type: 'radar',
      data: {
        labels: ["Ongoing Development", "Code Quality", "Community", "Hash Power", "Settlement Speed", "Ease of Use", "Coin Distribution", "Transactions", "Decentralization"],
        datasets: [
          {
            label: "1950",
            fill: true,
            backgroundColor: "rgba(255,120,50,0.2)",
            borderColor: "#FF6600",
            pointBorderColor: "#fff",
            pointStyle: "dot",
            pointBackgroundColor: "#FF0000",
            data: datanums
          },
          {
            label: "2",
            fill: false,
            backgroundColor: "#fff",
            borderColor: "#ccc",
            pointBorderColor: "#fff",
            borderWidth: 4,
            pointRadius: 0,
            pointBackgroundColor: "#fff",
            data: [10,10,10,10,10,10,10,10,10]
          },
          {
            label: "3",
            fill: false,
            backgroundColor: "#fff",
            borderColor: "#fff",
            borderWidth: 1,
            pointBorderColor: "#fff",
            pointBackgroundColor: "#fff",
            data: [0,0,0,0,0,0,0,0,0]
          }
        ]
      },
        options: {
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

        // Hides the scale
        display: true
    }
      }
  });
  }

  })

});

Template.currency.events({
  'click #dash': function() {
    var route = "/currency/" + this.slug;
    FlowRouter.go(route);
  }
});

Template.currency.helpers({
  finalValue () {
    if (this.maxCoins && this.marketCap) {
    return Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  } else {
    return "calculating..."
  }
  },
  marketCap () {
    return Math.round(this.marketCap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  circulating () {
    return Math.round(this.circulating).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  hashpower: function() {
    return this.hashpower ? Math.round(this.hashpower).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N\\A'
  },
  launchDate () {
    if (this.genesisTimestamp) {
    return "Launched " + moment(this.genesisTimestamp).fromNow();
  } else {
    return "";
  }
  },
  link () {
    if (this.genesisTimestamp) {
    return "#";
  } else {
    return "/currency/" + this._id + "?edit=launchdate";
  }
  },
  linktext () {
    if (this.genesisTimestamp) {
      return "";
    } else {
      return "Add the " + this.currencyName + " launch date!"
    }
  }
});


import { Template } from 'meteor/templating';
import { Currencies } from '../lib/database/Currencies.js';

Template.currencyDetail.onRendered(function (){
var data = Currencies.findOne({_id: FlowRouter.getParam("_id")});
console.log(data.premine);

  var ctx = document.getElementById("distribution").getContext('2d');
ctx.canvas.width = 200;
ctx.canvas.height = 260;
  var chart = new Chart(ctx, {
      // The type of chart we want to create
      type: 'doughnut',


      // The data for our dataset
      data: {
          labels: ["Founder(s) share: " + data.premine, "Mined coins: " + data.circulating, "Not yet mined: " + (data.maxCoins - data.circulating)],
          datasets: [{
              data: [(((data.premine / data.maxCoins) * 100).toFixed()), ((((data.circulating - data.premine) / data.maxCoins) * 100).toFixed()), ((((data.maxCoins - data.circulating)/data.maxCoins) * 100).toFixed())],
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

var radar = document.getElementById("radar").getContext('2d');
radar.canvas.width = 400;
radar.canvas.height = 300;
  var radarchart = new Chart(radar, {
      type: 'radar',
      data: {
        labels: ["Ongoing Development", "Code Quality", "Hash Power", "Ease of Use", "Coin Distribution", "Transactions"],
        datasets: [
          {
            label: "1950",
            fill: true,
            backgroundColor: "rgba(179,181,198,0.2)",
            borderColor: "rgba(179,181,198,1)",
            pointBorderColor: "#fff",
            pointStyle: "star",
            pointBackgroundColor: "rgba(179,181,198,1)",
            data: [6,7,2,8,1,3]
          },
          {
            label: "2",
            fill: false,
            backgroundColor: "#fff",
            borderColor: "#fff",
            pointBorderColor: "#fff",
            borderWidth: 4,
            pointRadius: 0,
            pointBackgroundColor: "#fff",
            data: [10,10,10,10,10,10]
          },
          {
            label: "3",
            fill: false,
            backgroundColor: "#fff",
            borderColor: "#fff",
            borderWidth: 1,
            pointBorderColor: "#fff",
            pointBackgroundColor: "#fff",
            data: [0,0,0,0,0,0]
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


});

Template.currencyDetail.events({});

Template.currencyDetail.helpers({
  thiscurrency () {
    return Currencies.findOne({_id: FlowRouter.getParam("_id")});
  },
  launchDate () {
    console.log(FlowRouter.getParam("_id"));
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

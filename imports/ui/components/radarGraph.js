import {
  Template
} from 'meteor/templating';
import {
  Currencies
} from '/lib/database/Currencies.js';
import {
  GraphData
} from '/lib/database/GraphData.js'
import Chart from 'chart.js';

import './radarGraph.html'

Template.radarGraph.onCreated(function () {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('approvedcurrencies');
    SubsCache.subscribe('graphdata');
  })
  this.filter = !this.data._id? {slug: FlowRouter.getParam("slug")}: {_id: this.data._id}
  this.id = (!this.data._id? FlowRouter.getParam("slug"): this.data._id)+"-radar"
  console.log(this.data)
})

Template.radarGraph.onRendered(function () {
  // self.autorun(function(){
  //   // Gets the _id of the current currency and only subscribes to that particular currency
  //   SubsCache.subscribe('approvedcurrency', FlowRouter.getParam('slug'))
  //   SubsCache.subscribe('hashalgorithm')
  // })
// })
  var self = this
  // console.log(filter, (filter.slug? filter.slug: filter._id)+"-radar")
  var radar = document.getElementById(self.id).getContext('2d')
  radar.canvas.width = this.data.width;
  radar.canvas.height = this.data.height

  let currency = Currencies.findOne(self.filter) || {}

  let graphdata = GraphData.findOne({
    _id: 'elodata'
  }) || {}
  
  const {codebaseMaxElo, codebaseMinElo, communityMaxElo, communityMinElo, walletMinElo, walletMaxElo, decentralizationMaxElo, decentralizationMinElo, developmentMinElo, developmentMaxElo} = graphdata
  
  var wallet = ((currency.walletRanking - walletMinElo)/((walletMaxElo - walletMinElo) || 1)) * 10;
  var community = (((currency.communityRanking || communityMinElo) - communityMinElo) / ((communityMaxElo - communityMinElo) || 1)) * 10;
  let codebase = (((currency.codebaseRanking || codebaseMinElo) - codebaseMinElo) / ((codebaseMaxElo - codebaseMinElo) || 1)) * 10
  let decentralization = (((currency.decentralizationRanking || decentralizationMinElo) - decentralizationMinElo) / ((decentralizationMaxElo - decentralizationMinElo) || 1)) * 10 
  let development = (((currency.gitCommits || developmentMinElo) - developmentMinElo) / ((developmentMaxElo - developmentMinElo) || 1)) * 10

  var datanums = [development,codebase,community,2,7,wallet,1,3,decentralization];

  var options = Object.assign(
    {
      responsive: false,
      defaultFontColor: 'red',
      tooltips: {
        enabled: false
      },
      maintainAspectRatio: false,
      title: {
        display: false
      },
      legend: {
        display: false,
        position: 'bottom',
        labels: {
          fontColor: 'red',
          display: true,
        }
      },
      scale: {
        pointLabels: {
          fontSize: 14
        },

        // Hides the scale
        display: true
      }
    },
    this.data.options
  )
  this.radarchart = new Chart(radar, {
    type: 'radar',
    data: {
      labels: ["Ongoing Development", "Code Quality", "Community", "Hash Power", "Settlement Speed", "Ease of Use", "Coin Distribution", "Transactions", "Decentralization"],
      datasets: [{
          label: "1950",
          fill: true,
          backgroundColor: "rgba(255,120,50,0.2)",
          borderColor: "#FF6600",
          pointBorderColor: "#fff",
          pointStyle: "dot",
          pointBackgroundColor: "#FF0000",
          data: datanums //[6,7,2,2,7,8,1,3]
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
          data: [10, 10, 10, 10, 10, 10, 10, 10, 10]
        },
        {
          label: "3",
          fill: false,
          backgroundColor: "#fff",
          borderColor: "#fff",
          borderWidth: 1,
          pointBorderColor: "#fff",
          pointBackgroundColor: "#fff",
          data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
      ]
    },
    options: options
  });

});


// Template.radarGraph.events({})

Template.radarGraph.helpers({
  thisId(){
    return Template.instance().id
  },
  class(){
    return Template.instance().class
  }
});
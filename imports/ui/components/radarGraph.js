import {
  Template
} from 'meteor/templating';
import {
  GraphData,
} from '/imports/api/indexDB.js';
import {FlowRouter} from 'meteor/ostrio:flow-router-extra';

import Chart from 'chart.js';

import './radarGraph.html'

import { quality } from '/imports/api/utilities'
import { radarEvent } from '/imports/api/utilities'

Template.radarGraph.onCreated(function () {
  var self = this
  self.autorun(function(){
    SubsCache.subscribe('graphdata');
  })
  this.filter = !this.data._id? {slug: FlowRouter.getParam("slug")}: {_id: this.data._id}
  this.id = (!this.data._id? FlowRouter.getParam("slug"): this.data._id)+"-radar"
  this.quality = quality(Template.parentData())
})

Template.radarGraph.onRendered(function () {
  var self = this
  var radar = document.getElementById(self.id).getContext('2d')
  radar.canvas.width = this.data.width;
  radar.canvas.height = this.data.height

  let currency = Template.parentData()

  let graphdata = GraphData.findOne({
    _id: 'elodata'
  }) || {}
  
  const {codebaseMaxElo, codebaseMinElo, communityMaxElo, communityMinElo, walletMinElo, walletMaxElo, decentralizationMaxElo, decentralizationMinElo, developmentMinElo, developmentMaxElo} = graphdata
  
  // var wallet = ((currency.walletRanking - walletMinElo)/((walletMaxElo - walletMinElo) || 1)) * 10;
  currency.circulating = currency.circulating || 0 // this is fetched from an API and may not be available

  let distribution = ((currency.maxCoins - (Number(currency.circulating) + Number(currency.premine))) / currency.maxCoins) * 10
  if (isNaN(distribution) || distribution < 0) {
    distribution = 0
  } else if (distribution > 10) {
    distribution = 10
  } // some data points may be invalid
  var community = (((currency.communityRanking || communityMinElo) - communityMinElo) / ((communityMaxElo - communityMinElo) || 1)) * 10;
  let codebase = (((currency.codebaseRanking || codebaseMinElo) - codebaseMinElo) / ((codebaseMaxElo - codebaseMinElo) || 1)) * 10
  let decentralization = (((currency.decentralizationRanking || decentralizationMinElo) - decentralizationMinElo) / ((decentralizationMaxElo - decentralizationMinElo) || 1)) * 10 
  let development = (((currency.gitCommits || developmentMinElo) - developmentMinElo) / ((developmentMaxElo - developmentMinElo) || 1)) * 10

  var datanums = [development,codebase,community,distribution,decentralization]

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

  let q = this.quality
  this.radarchart = new Chart(radar, {
    type: 'radar',
    data: {
      labels: ["Ongoing Development", "Code Quality", "Community", "Coin Distribution", "Decentralization"],
      datasets: [{
          label: "1950",
          fill: true,
          backgroundColor: q > 0.1 ? "rgba(255,120,50,0.2)" : 'rgba(202,202,202,0.2)', // if quality is ok, leave the current color, else, set the color to #cacaca
          borderColor: q > 0.1 ? '#FF6600' : '#cacaca',
          pointBorderColor: "#fff",
          pointStyle: "dot",
          pointBackgroundColor: q > 0.1 ? '#FF0000' : '#cacaca',
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
          data: [10, 10, 10, 10, 10]
        },
        {
          label: "3",
          fill: false,
          backgroundColor: "#fff",
          borderColor: "#fff",
          borderWidth: 1,
          pointBorderColor: "#fff",
          pointBackgroundColor: "#fff",
          data: [0, 0, 0, 0, 0]
        }
      ]
    },
    options: options
  })

  document.getElementById(this.id).addEventListener('click', (event) => radarEvent(this.radarchart, event, (type, id) => {
    console.log(type, id)

    if (type === 'chart') {
      FlowRouter.go(`/currency/${currency.slug}`)
    }
  }))

  document.getElementById(this.id).addEventListener('mousemove', (event) => radarEvent(this.radarchart, event, (type, id, inside) => {
    if (inside) {
      if (document.getElementById(this.id).style.cursor !== 'pointer') {
        document.getElementById(this.id).style.cursor = 'pointer'
      }
    } else {
      if (document.getElementById(this.id).style.cursor !== 'auto') {
        document.getElementById(this.id).style.cursor = 'auto'
      }
    }
  }, 'hover'))
})

Template.radarGraph.helpers({
  dataQuality: () => {
    return Math.ceil(Template.instance().quality * 10)
  },
  needsQuality: () => Template.instance().quality <= 0.1,
  thisId(){
    return Template.instance().id
  },
  class(){
    return Template.instance().class
  }
});
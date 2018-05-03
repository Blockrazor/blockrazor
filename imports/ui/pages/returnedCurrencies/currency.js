import { Chart } from 'chart.js'
import { Template } from 'meteor/templating';
import { GraphData } from '/imports/api/indexDB.js';

import "/imports/ui/components/radarGraph.js"
import "./currency.html"
import "../currencyDetail/currency.scss"

Template.currency.onRendered(function () {
 //init tooltips, bootstrap doesn't init it automatically with meteor :(
  $('[data-toggle="tooltip"]').tooltip()
});

Template.currency.events({
  'click .currency-card': function(event) {
    if (event.target.tagName == "I"){
      return
    }
    var route = "/currency/" + this.slug;
    FlowRouter.go(route);
  }
});

Template.currency.helpers({
  graphOptions(){
    return {
    animation: {
      duration: 0
    },
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
  },
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

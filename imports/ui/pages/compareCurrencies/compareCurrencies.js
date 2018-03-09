import { Template } from 'meteor/templating';
import { Features } from '../../../../lib/database/Features'
import { Currencies } from '../../../../lib/database/Currencies'
import { GraphData } from '../../../../lib/database/GraphData'
import { Redflags } from '../../../../lib/database/Redflags'
import Cookies from 'js-cookie'

import '../../layouts/MainBody.html'
import './compareCurrencies.template.html'

Template.compareCurrencies.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('graphdata')
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('features')
		SubsCache.subscribe('redflags')
	})

	this.compared = new ReactiveVar([])
	this.colors = new ReactiveDict()
	this.filter = new ReactiveVar('')

	this.add = new ReactiveVar(true)
})

Template.compareCurrencies.onRendered(function (){
	const radar = document.getElementById('radar').getContext('2d')
	radar.canvas.width = 800
	radar.canvas.height = 600

	this.radarchart = new Chart(radar, {
		type: 'radar',
		data: {
			labels: ['Ongoing Development', 'Code Quality', 'Community', 'Hash Power', 'Settlement Speed', 'Ease of Use', 'Coin Distribution', 'Transactions', 'Decentralization'],
			datasets: [{
				label: '2',
				fill: false,
				backgroundColor: '#fff',
				borderColor: '#ccc',
				pointBorderColor: '#fff',
				borderWidth: 4,
				pointRadius: 0,
				pointBackgroundColor: '#fff',
				data: [10,10,10,10,10,10,10,10,10]
			}, {
				label: '3',
				fill: false,
				backgroundColor: '#fff',
				borderColor: '#fff',
				borderWidth: 1,
				pointBorderColor: '#fff',
				pointBackgroundColor: '#fff',
				data: [0,0,0,0,0,0,0,0,0]
			}]
		},
		options: {
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
		}
	})
})

Template.compareCurrencies.events({
	'change #js-compare': (event, templateInstance) => {
		event.preventDefault()

		cmpArr = templateInstance.compared.get()

		templateInstance.add.set(false)

		// don't add a new currency if it's already on the graph
		if ($(event.currentTarget).val() && !~cmpArr.indexOf($(event.currentTarget).val())) {
			cmpArr.push($(event.currentTarget).val())
			templateInstance.compared.set(cmpArr)

			// a way to randomly generate a color
		  	let color = '#'+(Math.random()*0xFFFFFF<<0).toString(16)
		  	let rgb = parseInt(color.substring(1), 16)

		  	templateInstance.colors.set($(event.currentTarget).val(), color)

		  	let currency = Currencies.findOne({
		  		_id: $(event.currentTarget).val()
		  	}) || {}

		  	let graphdata = GraphData.findOne({
		  		_id: 'elodata'
		  	}) || {}


			const {codebaseMaxElo, codebaseMinElo, communityMaxElo, communityMinElo, walletMinElo, walletMaxElo} = graphdata

			var wallet = ((currency.walletRanking - walletMinElo)/((walletMaxElo - walletMinElo) || 1)) * 10;
			var community = (((currency.communityRanking || communityMinElo) - communityMinElo) / ((communityMaxElo - communityMinElo) || 1)) * 10;
			let codebase = (((currency.codebaseRanking || codebaseMinElo) - codebaseMinElo) / ((codebaseMaxElo - codebaseMinElo) || 1)) * 10

		  	let maxD = graphdata.decentralizationMaxElo
		  	let minD = graphdata.decentralizationMinElo

		  	let decentralization = (((currency.decentralizationRanking || minD) - minD) / ((maxD - minD) || 1)) * 10 

		  	let minDev = graphdata.developmentMinElo
		  	let maxDev = graphdata.developmentMaxElo

		  	let development = (((currency.gitCommits || minDev) - minDev) / ((maxDev - minDev) || 1)) * 10 

		  	let nums = [development,codebase,community,2,7,wallet,1,3,decentralization]

		  	// push the new data to the chart
		  	templateInstance.radarchart.data.datasets.push({
		  		label: $(event.currentTarget).val(),
		  		fill: true,
				backgroundColor: `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, 0.2)`, // a way to convert color from hex to rgb
				borderColor: color,
				pointBorderColor: '#fff',
				pointStyle: 'dot',
				pointBackgroundColor: color,
				data: nums
			})

		  	// update the chart to reflect new data
		  	templateInstance.radarchart.update()
		}
	},
	'click .js-delete': function(event, templateInstance) {
		event.preventDefault()

		cmpArr = cmpArr.filter(i => i !== this._id)
		templateInstance.compared.set(cmpArr)

		// remove data from the chart and update it accordingly
		templateInstance.radarchart.data.datasets = templateInstance.radarchart.data.datasets.filter(i => i.label !== this._id)
		templateInstance.radarchart.update()
	},
	'keyup #js-filter': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.filter.set($(event.currentTarget).val())
	},
	'click #js-add': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.add.set(!templateInstance.add.get())
	}
})

Template.compareCurrencies.helpers({
	// get all currencies available for comparasion (excluding the current currency)
  	currencies: () => Currencies.find({
  		$or: [{
  			currencyName: new RegExp(Template.instance().filter.get(), 'ig')
  		}, {
  			currencySymbol: new RegExp(Template.instance().filter.get(), 'ig')
  		}],
  		_id: {
  			$nin: Template.instance().compared.get()
  		}
  	}).fetch(),
  	// get all currencies currently on the list
  	comparedCurrencies: () => {
  		let cur = Currencies.find({
  			_id: {
  				$in: Template.instance().compared.get()
  			}
		  }, 
		  {
				fields: {
					currencyName: 1,
					currencySymbol: 1,
					circulating: 1,
					marketCap: 1,
					maxCoins: 1,
					hashpower: 1,
					slug: 1,
		  }}
		).fetch()

		// add the color field
		cur.forEach(i => i.color = Template.instance().colors.get(i._id))

		return cur
	},
	colspan: () => Template.instance().compared.get().length + 2,
	add: () => Template.instance().add.get() ? 'inline' : 'none',
	top3: () => [1,2,3],
	topFeature: function(num) {
		return (Features.find({
			currencySlug: this.slug
		}, {
			sort: {
				rating: -1
			},
			fields: {
				featureName: 1
			}
		}).fetch()[num-1] || {}).featureName || '-'
	},
	topFlag: function(num) {
		return (Redflags.find({
			currencyId: this._id
		}, {
			sort: {
				rating: -1
			},
			fields: {
				name: 1
			}
		}).fetch()[num-1] || {}).name || '-'
	},
	hashpower: function() {
		return this.hashpower ? Math.round(this.hashpower).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N\\A'
	},
	finalValue: function() {
		return Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	martketCap: function() {
		return Math.round(this.marketCap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	circulating: function() {
		return Math.round(this.circulating).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	founder: () => "No data" // currently, there's no data about founders
})

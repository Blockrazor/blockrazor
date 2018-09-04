import {
	Template
} from 'meteor/templating';
import {
	Features,
	Currencies,
	GraphData,
	Redflags,
} from '/imports/api/indexDB.js'

import Cookies from 'js-cookie'
import Chart from 'chart.js';


import {
	FlowRouter
} from 'meteor/ostrio:flow-router-extra'

import '/imports/ui/components/typeahead'
import './compareCurrencies.scss'
import './compareCurrencies.html'

import { radarEvent, intersection } from '/imports/api/utilities'


Template.compareCurrencies.onCreated(function () {
	this.autorun(() => {
		SubsCache.subscribe('graphdata')
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('features')
		SubsCache.subscribe('redflags')
	})

	this.randomizeColors = () => {
		Object.keys(this.colors.all()).forEach(i => {
			let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
			this.colors.set(i, color)
		})

		this.radarchart.data.datasets = this.radarchart.data.datasets.map(i => {
			let color = this.colors.get(i.label)
			if (color) {
				let rgb = parseInt(color.substring(1), 16)

				return _.extend(i, {
					borderColor: color,
					pointBackgroundColor: color,
					backgroundColor: `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, 0.2)`
				})
			}

			return i
		})

		this.barchart.data.datasets = this.barchart.data.datasets.map(i => {
			let color = this.colors.get(i.label)

			if (color) {
				let rgb = parseInt(color.substring(1), 16)

				return _.extend(i, {
					borderColor: color,
					backgroundColor: `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, 0.2)`
				})
			}

			return i
		})

		this.barchart.update()
		this.radarchart.update()
	}

	//used to init from route params and in typeAhead events
	this.curryEvent = function(event, value, templateInstance){
		cmpArr = templateInstance.compared.get()

		cmpArr.push(value.currencySymbol)
		templateInstance.compared.set(cmpArr)

		let path = `/compareCurrencies/${_.uniq(templateInstance.compared.get()).toString().replace(/,/g, '-')}`
		history.replaceState({
			path: path
		}, 'compareCurrencies', path) // replace the url field in the browser without reloading the page


		// a way to randomly generate a color
		let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
		let rgb = parseInt(color.substring(1), 16)

		templateInstance.colors.set(value.currencySymbol, color)

		let currency = Currencies.findOneLocal({
			_id: value._id
		}) || {}

		let graphdata = GraphData.findOne({
			_id: 'elodata'
		}) || {}


		const {
			codebaseMaxElo,
			codebaseMinElo,
			communityMaxElo,
			communityMinElo,
			walletMinElo,
			walletMaxElo,
			hashpowerMinElo,
			hashpowerMaxElo
		} = graphdata

		currency.circulating = currency.circulating || 0 // this is fetched from an API and may not be available

		let distribution = ((currency.maxCoins - (Number(currency.circulating) + Number(currency.premine))) / currency.maxCoins) * 10
		if (isNaN(distribution) || distribution < 0) {
			distribution = 0
		} else if (distribution > 10) {
				distribution = 10
		} // some data points may be invalid

		var wallet = ((currency.walletRanking - walletMinElo) / ((walletMaxElo - walletMinElo) || 1)) * 10;
		var community = (((currency.communityRanking || communityMinElo) - communityMinElo) / ((communityMaxElo - communityMinElo) || 1)) * 10;
		let codebase = (((currency.codebaseRanking || codebaseMinElo) - codebaseMinElo) / ((codebaseMaxElo - codebaseMinElo) || 1)) * 10

		let maxD = graphdata.decentralizationMaxElo
		let minD = graphdata.decentralizationMinElo

		let decentralization = (((currency.decentralizationRanking || minD) - minD) / ((maxD - minD) || 1)) * 10

		let minDev = graphdata.developmentMinElo
		let maxDev = graphdata.developmentMaxElo

		let development = (((currency.gitCommits || minDev) - minDev) / ((maxDev - minDev) || 1)) * 10

		let hashpower = (((currency.hashpower || hashpowerMinElo) - hashpowerMinElo) / ((hashpowerMaxElo - hashpowerMinElo) || 1)) * 10

		let nums = [development, codebase, community, distribution, decentralization]

		let filterAlreadyAddedCurrency = (dataset, key) => {
			return dataset.filter((obj, pos, arr) => {
				return arr.map(mapObj => mapObj[key]).indexOf(obj[key]) === pos;
			})
		}

		// push the new data to the chart
		templateInstance.radarchart.data.datasets.push({
			label: value.currencySymbol,
			fill: true,
			backgroundColor: `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, 0.2)`, // a way to convert color from hex to rgb
			borderColor: color,
			pointBorderColor: '#fff',
			pointStyle: 'dot',
			pointBackgroundColor: color,
			data: nums
		})

		// filter any currency data that had already been added
		if(templateInstance.barchart.data.datasets.length >= 1) {
			var radarChartData = templateInstance.radarchart.data.datasets;
			templateInstance.radarchart.data.datasets = filterAlreadyAddedCurrency(radarChartData, 'label');
		}

		templateInstance.barchart.data.datasets.push({
			label: value.currencySymbol,
			backgroundColor: `rgba(${(rgb >> 16) & 255}, ${(rgb >> 8) & 255}, ${rgb & 255}, 0.2)`,
			borderColor: color,
			borderWidth: 1,
			data: [hashpower, 7, wallet, 3]
		})

		// filter any currency data that had already been added
		if(templateInstance.barchart.data.datasets.length >= 1) {
			var barChartData = templateInstance.barchart.data.datasets;
			templateInstance.barchart.data.datasets = filterAlreadyAddedCurrency(barChartData, 'label');
		}

		// update the chart to reflect new data
		templateInstance.radarchart.update()
		templateInstance.barchart.update()
	}

	let currencies = FlowRouter.getParam('currencies') && FlowRouter.getParam('currencies').split('-') || []

	this.compared = new ReactiveVar(currencies)
	this.colors = new ReactiveDict()

	currencies.forEach(i => {
		let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
		let rgb = parseInt(color.substring(1), 16)

		this.colors.set(i, color)
	})

})

Template.compareCurrencies.onRendered(function () {
	const radar = document.getElementById('radar').getContext('2d')
	radar.canvas.width = 800
	radar.canvas.height = 600

	this.radarchart = new Chart(radar, {
		type: 'radar',
		data: {
			labels: ['Ongoing Development', 'Code Quality', 'Community', 'Coin Distribution', 'Decentralization'],
			datasets: [{
				label: '2',
				fill: false,
				backgroundColor: '#fff',
				borderColor: '#ccc',
				pointBorderColor: '#fff',
				borderWidth: 4,
				pointRadius: 0,
				pointBackgroundColor: '#fff',
				data: [10, 10, 10, 10, 10]
			}, {
				label: '3',
				fill: false,
				backgroundColor: '#fff',
				borderColor: '#fff',
				borderWidth: 1,
				pointBorderColor: '#fff',
				pointBackgroundColor: '#fff',
				data: [0, 0, 0, 0, 0]
			}]
		},
		options: {
			responsive: true,
			defaultFontColor: 'red',
			tooltips: {
				enabled: false
			},
			maintainAspectRatio: true,
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
				// Hides the scale
				display: true
			}
		}
	})

	document.getElementById('radar').addEventListener('click', (event) => radarEvent(this.radarchart, event, console.log))
	document.getElementById('radar').addEventListener('mousemove', (event) => radarEvent(this.radarchart, event, (type, id, inside) => {
    if (inside) {
      if (document.getElementById('radar').style.cursor !== 'pointer') {
        document.getElementById('radar').style.cursor = 'pointer'
      }
    } else {
      if (document.getElementById('radar').style.cursor !== 'auto') {
        document.getElementById('radar').style.cursor = 'auto'
      }
    }
  }, 'hover'))

	let ctx = document.getElementById('bar').getContext('2d')
	ctx.canvas.width = 800
	ctx.canvas.height = 600
	this.barchart = new Chart(ctx, {
		type: 'horizontalBar',
		data: {
			labels: ['Hash Power', 'Settlement Speed', 'Ease of Use', 'Transactions'],
			datasets: []
		},
		options: {
			elements: {
				rectangle: {
					borderWidth: 2,
				}
			},
			responsive: true,
			legend: {
				position: 'right'
			}
		}
	})

	let inElem = []
	const barEvent = (event, func, type) => {
		event.preventDefault()
	    event.stopPropagation()

	    type = type || 'click'

	    let scale = this.barchart.scales['y-axis-0']

	    let clickables = ['hash-power', 'settlement-speed', 'ease-of-use', 'transactions']

	    let elem = clickables.map((i, ind) => ({
	      id: i,
	      width: scale.width,
	      height: 60,
	      left: 0,
	      top: (ind * (scale.height / (scale.maxIndex + 1))) + ((scale.height / ((scale.maxIndex + 1) * 2)) - 30)
	    })) // common elements

	    let point = {
	      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
	      y: event.clientY - event.currentTarget.getBoundingClientRect().top
	    }

	    elem.forEach(elem => {
	    	if (intersection(point, elem)) {
		      	inElem[elem.id] = true

		      	func(elem.id, event.currentTarget.id, true)
		    } else {
		      	if (type === 'hover' && inElem[elem.id]) {
		        	func(elem.id, event.currentTarget.id, false)
		      	}

		      	inElem[elem.id] = false
		    }
	    })
	}

	document.getElementById('bar').addEventListener('click', (event) => barEvent(event, console.log))
	document.getElementById('bar').addEventListener('mousemove', (event) => barEvent(event, (type, id, inside) => {
	    if (inside) {
	      if (document.getElementById('bar').style.cursor !== 'pointer') {
	        document.getElementById('bar').style.cursor = 'pointer'
	      }
	    } else {
	      if (document.getElementById('bar').style.cursor !== 'auto') {
	        document.getElementById('bar').style.cursor = 'auto'
	      }
	    }
	  }, 'hover'))

	Template.instance().compared.get().forEach(i => {
		Template.instance().curryEvent(null, Currencies.findOneLocal({
			currencySymbol: i
		}) || {}, Template.instance())
	})
})

Template.compareCurrencies.events({
	'click .js-delete': function (event, templateInstance) {
		event.preventDefault()

		cmpArr = cmpArr.filter(i => i !== this.currencySymbol)
		templateInstance.compared.set(cmpArr)

		// remove data from the chart and update it accordingly
		templateInstance.radarchart.data.datasets = templateInstance.radarchart.data.datasets.filter(i => i.label !== this.currencySymbol)
		templateInstance.radarchart.update()

		templateInstance.barchart.data.datasets = templateInstance.barchart.data.datasets.filter(i => i.label !== this.currencySymbol)
		templateInstance.barchart.update()

		let path = `/compareCurrencies/${_.uniq(templateInstance.compared.get()).toString().replace(/,/g, '-')}`
		history.replaceState({
			path: path
		}, 'compareCurrencies', path) // replace the url field in the browser without reloading the page
	},
	'click #js-randomize': (event, templateInstance) => {
		event.preventDefault()

		templateInstance.randomizeColors()
	}
})

Template.compareCurrencies.helpers({
	// get all currencies currently on the list
	comparedCurrencies: () => {
		let cur = Currencies.find({
			currencySymbol: {
				$in: Template.instance().compared.get()
			}
		}, {
			fields: {
				currencyName: 1,
				currencySymbol: 1,
				circulating: 1,
				marketCap: 1,
				maxCoins: 1,
				hashpower: 1,
				slug: 1,
				price: 1,
				cpt: 1,
				cpc: 1,
				premine: 1
			}
		}).fetch()

		// add the color field
		cur.forEach(i => i.color = Template.instance().colors.get(i.currencySymbol))

		return cur
	},
	typeAheadProps: () => {
		return 	{
			limit: 15,
			query: function(templ, entry){
				return {
					$or: [{
						currencyName: new RegExp(entry, 'ig')
					}, {
						currencySymbol: new RegExp(entry, 'ig')
					}],
					currencySymbol: {
						$nin: templ.compared.get()
					}
				}
			},
			projection: function(templ, entry){
				return {
					limit: 15,
					sort: {
						currencyName: 1
					}
				}
			},
			add: Template.instance().curryEvent,
			col: Currencies, //collection to use
			template: Template.instance(), //parent template instance
			focus: true,
			autoFocus: true,
			quickEnter: true,
			displayField: "currencyName", //field that appears in typeahead select menu
            placeholder: TAPi18n.__('currency.compare.select'),
		}
	},
	colspan: () => Template.instance().compared.get().length + 2,
	top3: () => [1, 2, 3],
	topFeature: function (num) {
		return (Features.find({
			currencySlug: this.slug
		}, {
			sort: {
				rating: -1
			},
			fields: {
				featureName: 1
			}
		}).fetch()[num - 1] || {}).featureName || '-'
	},
	topFlag: function (num) {
		return (Redflags.find({
			currencyId: this._id
		}, {
			sort: {
				rating: -1
			},
			fields: {
				name: 1
			}
		}).fetch()[num - 1] || {}).name || '-'
	},
	hashpower: function () {
		return this.hashpower ? Math.round(this.hashpower).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 'N\\A'
	},
	finalValue: function () {
		return (isNaN(this.marketCap) || isNaN(this.maxCoins)) ? '' : Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	martketCap: function () {
		return Math.round(this.marketCap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	circulating: function () {
		return isNaN(this.circulating) ? '' : Math.round(this.circulating).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	founder: () => "No data" // currently, there's no data about founders
})


Template.compareCurrencies.onDestroyed(function () {
	$(".typeahead").typeahead("destroy")
	$(".typeahead").off("keyup")
})

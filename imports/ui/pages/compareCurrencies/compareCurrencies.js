import {
	Template
} from 'meteor/templating';
import {
	Features,
	Currencies,
	GraphData,
	Redflags,
	LocalCurrencies,
} from '/imports/api/indexDB.js'

import Cookies from 'js-cookie'
import typeahead from 'corejs-typeahead' //maintained typeahead

import '/imports/ui/stylesheets/typeahead.css'

import {
	FlowRouter
} from 'meteor/staringatlights:flow-router'

import './compareCurrencies.css'
import './compareCurrencies.html'


Template.compareCurrencies.onCreated(function () {
	this.autorun(() => {
		SubsCache.subscribe('graphdata')
		SubsCache.subscribe('approvedcurrencies')
		SubsCache.subscribe('features')
		SubsCache.subscribe('redflags')
	})

	let currencies = FlowRouter.getParam('currencies') && FlowRouter.getParam('currencies').split('-') || []

	this.compared = new ReactiveVar(currencies)
	this.colors = new ReactiveDict()
	this.methodReady = new ReactiveVar(false)

	currencies.forEach(i => {
		let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
		let rgb = parseInt(color.substring(1), 16)

		this.colors.set(i, color)
	})
	this.init = function () {
		var option1 = {
			hint: true,
			highlight: true,
			minLength: 0,
		}
		var option2 = {
			name: 'states',
			display: (x) => x.currencyName,
			limit: 15,
			source: currySearch(Template.instance())
		}

		//binding for updating autocomplete source on deletion of items
		this.option1 = option1
		this.option2 = option2

		function currySearch(template) {
			return function typeAheadSearch(entry, CB) {
				CB(
					template.TransitoryCollection.find({
						$or: [{
							currencyName: new RegExp(entry, 'ig')
						}, {
							currencySymbol: new RegExp(entry, 'ig')
						}],
						currencySymbol: {
							$nin: template.compared.get()
						}
					}, {
						limit: 15,
						sort: {
							currencyName: 1
						}
					}).fetch()
				)
			}
		}

		function curryEvent(template) {
			return function addSelection(event, value) {
				var templateInstance = template
				cmpArr = templateInstance.compared.get()

				// don't add a new currency if it's already on the graph
				cmpArr.push(value.currencySymbol)
				templateInstance.compared.set(cmpArr)

				let path = `/compareCurrencies/${_.uniq(templateInstance.compared.get()).toString().replace(/,/g, '-')}`
				history.replaceState({
					path: path
				}, 'compareCurrencies', path) // replace the url field in the browser without reloading the page

				//this whole dance is necessery because the datasource doesn't update if not reinitialized
				//and because it can't be focued if opened, and it can't be opened if already focused on select event
				$('.typeahead').typeahead('destroy')
				$('.typeahead').blur()
				$('.typeahead').typeahead(option1, option2)
				$('.typeahead').typeahead('val', '');
				$('.typeahead').focus()
				// $('.typeahead').typeahead('open');

				// a way to randomly generate a color
				let color = '#' + (Math.random() * 0xFFFFFF << 0).toString(16)
				let rgb = parseInt(color.substring(1), 16)

				templateInstance.colors.set(value.currencySymbol, color)

				let currency = templateInstance.TransitoryCollection.findOne({
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
					walletMaxElo
				} = graphdata

				var wallet = ((currency.walletRanking - walletMinElo) / ((walletMaxElo - walletMinElo) || 1)) * 10;
				var community = (((currency.communityRanking || communityMinElo) - communityMinElo) / ((communityMaxElo - communityMinElo) || 1)) * 10;
				let codebase = (((currency.codebaseRanking || codebaseMinElo) - codebaseMinElo) / ((codebaseMaxElo - codebaseMinElo) || 1)) * 10

				let maxD = graphdata.decentralizationMaxElo
				let minD = graphdata.decentralizationMinElo

				let decentralization = (((currency.decentralizationRanking || minD) - minD) / ((maxD - minD) || 1)) * 10

				let minDev = graphdata.developmentMinElo
				let maxDev = graphdata.developmentMaxElo

				let development = (((currency.gitCommits || minDev) - minDev) / ((maxDev - minDev) || 1)) * 10

				let nums = [development, codebase, community, 2, 7, wallet, 1, 3, decentralization]

				// push the new data to the chart
				templateInstance.radarchart.data.datasets.push({
					label: value._id,
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
		}

		//adds first found entry in autocomplete on enter keypress
		$('.typeahead').typeahead(option1, option2).on('keyup', {
			templ: Template.instance()
		}, function (event) {
			if (event.keyCode == 13) {
				var a = event.data.templ.TransitoryCollection.findOne({
					$or: [{
						currencyName: new RegExp(event.target.value, 'ig')
					}, {
						currencySymbol: new RegExp(event.target.value, 'ig')
					}],
					currencySymbol: {
						$nin: event.data.templ.compared.get()
					}
				}, {
					sort: {
						currencyName: 1
					}
				})
				if (a) {
					$('.typeahead').typeahead('val', '');
					$('.typeahead').focus()
					curryEvent(event.data.templ)(null, a)
				}
			}
		});

		$('.typeahead').focus()

		$('.typeahead').bind('typeahead:select', curryEvent(Template.instance()))

		$('.typeahead').bind('typeahead:autocomplete', curryEvent(Template.instance()))
	}
	//logic for receiving benefits of fast-render and yet using nonreactive data from method
	if (!LocalCurrencies.find().count()) {
		this.TransitoryCollection = Currencies
		// this.transitioning = new ReactiveVar(true)
		Meteor.call('fetchCurrencies', (err, res) => {
			res.forEach(x => {
				LocalCurrencies.insert(x)
			})
			this.TransitoryCollection = LocalCurrencies
			$('.typeahead').typeahead('destroy')
			this.methodReady.set(true)
			console.log(this.TransitoryCollection.find().fetch())
		})
	} else {
		this.TransitoryCollection = LocalCurrencies
		// this.transitioning = new ReactiveVar(false)
	}
})

Template.compareCurrencies.onRendered(function () {
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
				data: [10, 10, 10, 10, 10, 10, 10, 10, 10]
			}, {
				label: '3',
				fill: false,
				backgroundColor: '#fff',
				borderColor: '#fff',
				borderWidth: 1,
				pointBorderColor: '#fff',
				pointBackgroundColor: '#fff',
				data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
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

	this.autorun((comp)=>{
		if (this.methodReady.get()) {
			this.init()
			comp.stop()
		}
	})
	this.init()

	Template.instance().compared.get().forEach(i => {
		curryEvent(Template.instance())(null, TransitoryCollection.findOne({
			currencySymbol: i
		}) || {})
	})
})

Template.compareCurrencies.events({
	'click .js-delete': function (event, templateInstance) {
		event.preventDefault()

		cmpArr = cmpArr.filter(i => i !== this.currencySymbol)
		templateInstance.compared.set(cmpArr)

		//this whole dance is necessery because the datasource doesn't update if not reinitialized
		$('.typeahead').typeahead('destroy')
		$('.typeahead').typeahead(templateInstance.option1, templateInstance.option2)

		// remove data from the chart and update it accordingly
		templateInstance.radarchart.data.datasets = templateInstance.radarchart.data.datasets.filter(i => i.label !== this._id)
		templateInstance.radarchart.update()

		let path = `/compareCurrencies/${_.uniq(templateInstance.compared.get()).toString().replace(/,/g, '-')}`
		history.replaceState({
			path: path
		}, 'compareCurrencies', path) // replace the url field in the browser without reloading the page
	},
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
				price: 1
			}
		}).fetch()

		// add the color field
		cur.forEach(i => i.color = Template.instance().colors.get(i.currencySymbol))

		return cur
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
		return Math.round(this.marketCap / this.maxCoins).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	martketCap: function () {
		return Math.round(this.marketCap).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	circulating: function () {
		return Math.round(this.circulating).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	},
	founder: () => "No data" // currently, there's no data about founders
})


Template.compareCurrencies.onDestroyed(function () {
	$(".typeahead").typeahead("destroy")
	$(".typeahead").off("keyup")
})
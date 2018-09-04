import { Template } from 'meteor/templating'
import { Auctions } from '/imports/api/indexDB'
import Chart from 'chart.js'

import './priceChart.html'

Template.priceChart.onCreated(function() {
	this.autorun(() => {
		SubsCache.subscribe('timeAuctions', 9) // subscribe to last 9 days
	})
})

const genDate = (days) => moment().add(days, 'd').format(_globalDateFormat)
const strDate = (date) => moment(date).format(`${_globalDateFormat} HH:mm`)

Template.priceChart.onRendered(function() {
	let chart = document.getElementById('price').getContext('2d')

	let color = Chart.helpers.color
	this.chart = new Chart(chart, {
		type: 'line',
		data: {
			labels: [
				genDate(-6),
				genDate(-5),
				genDate(-4),
				genDate(-3),
				genDate(-2),
				genDate(-1),
				genDate(0)
			]
		},
		options: {
			legend: {
            	display: false,
        	},
			title: {
				text: TAPi18n.__('prices.krazor')
			},
			scales: {
				xAxes: [{
					type: 'time',
					time: {
						format: `${_globalDateFormat} HH:mm`,
						tooltipFormat: 'll HH:mm',
						unit: 'day'
					},
					scaleLabel: {
						display: true,
						labelString: TAPi18n.__('prices.date')
					}
				}],
				yAxes: [{
					scaleLabel: {
						display: true,
						labelString: TAPi18n.__('prices.value')
					},
					ticks: {
		                beginAtZero: true
		            }
				}]
			},
		}
	})

	this.autorun(() => {
		let dataset = Auctions.find({
			closed: true,
			'options.timeout': {
	            $gt: new Date().getTime() - 9*1000*60*60*24 // use 9 days here instead of 7 to get a smoother line
	        }			
		}, {
			sort: {
				createdAt: -1
			}
		}).fetch().map(i => {
			let pricePerKZR

			if (i.options.baseCurrency === 'KZR') {
				pricePerKZR = ((i.options.highest || 0) / i.options.amount)
			} else {
				pricePerKZR = (i.options.highest || 0) !== 0 ? (i.options.amount / (i.options.highest || 0)) : 0
			}

			return {
				x: strDate(i.options.timeout),
				y: pricePerKZR * (i.currentPrice || 1)
			}
		})

		if (dataset.length) {
			this.chart.data.datasets = [{
				label: TAPi18n.__('prices.krazor'),
				backgroundColor: color('#00ff00').alpha(0.5).rgbString(),
				borderColor: '#00ff00',
				fill: false,
				data: dataset
			}]

			this.chart.update() // this ensures chart's reactivity
		}
	})
})
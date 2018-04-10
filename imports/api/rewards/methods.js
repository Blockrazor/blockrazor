import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'

import { Features, Redflags } from '/imports/api/indexDB'
import { creditUserWith } from '../utilities'

Meteor.methods({
	rewardTopAction: (type, reward) => {
		check(type, String)
		check(reward, Number)

		let val = {}

		if (type === 'feature') {
			val = Features.findOne({
				featureName: {
					$exists: true
				}
			}, {
				sort: {
					ratings: -1, // first search by rating
					appeal: -1 // if there are mutliple results, search by the appeal
				}
			})
		} else if (type === 'redflag') {
			val = Redflags.findOne({
				name: {
					$exists: true
				}
			}, {
				sort: {
					ratings: -1, // first search by rating
					appeal: -1 // if there are mutliple results, search by the appeal
				}
			})
		} else if (type === 'comment') {
			// comments can be on features or on redflags, so we have to check both
			let featCom = Features.findOne({
				comment: {
					$exists: true
				}
			}, {
				sort: {
					ratings: -1, // first search by rating
					appeal: -1 // if there are mutliple results, search by the appeal
				}
			})

			let flagCom = Redflags.findOne({
				comment: {
					$exists: true
				}
			}, {
				sort: {
					ratings: -1, // first search by rating
					appeal: -1 // if there are mutliple results, search by the appeal
				}
			})

			// if both are defined, we have to check which one is better
			if (featCom && flagCom) {
				if (featCom.rating > flagCom.rating) {
					val = featCom
				} else if (featCom.rating < flagCom.rating) {
					val = flagCom
				} else {
					if (featCom.appeal > flagCom.appeal) {
						val = featCom
					} else {
						val = flagCom
					}
				}
			// else we can just return the defined one
			} else {
				val = featCom || flagCom
			}
		} else if (type === 'summary') {
			val = Summaries.findOne({
				summary: {
					$exists: true
				}
			}, {
				sort: {
					ratings: -1, // first search by rating
					appeal: -1 // if there are mutliple results, search by the appeal
				}
			})
		}

		if (val) {
			creditUserWith(reward, val.createdBy, `having a top ${type} in the last hour`,'topCommentReward')
		}
	},
	rewardAll: (reward) => {
		check(reward, Number);

		['feature', 'comment', 'redflag', 'summary'].forEach(i => Meteor.call('rewardTopAction', i, reward, (err, data) => {}))
	}
})
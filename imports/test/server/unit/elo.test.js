import { chai, assert } from 'meteor/practicalmeteor:chai'
import { Meteor } from 'meteor/meteor'
import { callWithPromise } from '../utils'
import { GraphData } from '../../../../lib/database/GraphData' // import graphdata database

import '../../../../server/methods/elorankings' // import the required methods

describe('ELO', function() {
	it('graph data is updated correctly', function() {
    	return callWithPromise('updateGraphdata').then(data => { // mocha likes promises
    		let graphdata = GraphData.findOne({}) // get graph data

    		let pos = ['wallet', 'community', 'codebase', 'decentralization', 'development']

    		for (let i = 0; i < pos.length; i++) {
    			assert.isNumber(graphdata[`${pos[i]}MinElo`]) // check if the data is correct
    			assert.isNumber(graphdata[`${pos[i]}MaxElo`])
    		}
    	})
  	})
})

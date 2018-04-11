import { Meteor } from 'meteor/meteor'
import { Problems } from '../problems'
import { ProblemComments } from '../problemComments'

Meteor.publish('problems', () => Problems.find({}))

const calculateReward = (problem) => {
    return problem.credit.reduce((i1, i2) => i1 + i2.bounty, 0)
}

Meteor.publish('bountyProblems', function(limit, skip) {
  	limit = limit || 0
  	skip = skip || 0

    if (limit === 0) { // if there's no limit, fallback to regular find to improve performance
	    let sub = Problems.find({
	    	$or: [{
		       	type: 'feature'
		    }, {
		      	type: 'bug'
		    }],
		    open: true,
		    solved: false // skip all documents that won't be shown on the bounty page anyways
		}).observeChanges({ // using observer changes, we can transform the data before it's published
	    	added: (id, fields) => {
	      		this.added('problems', id, _.extend(fields, {
	        		reward: calculateReward(fields) // add reward field
	      		}))
	    	},
	    	changed: (id, fields) => {
	      		this.changed('problems', id, _.extend(fields, {
	        		reward: calculateReward(fields)
	      		}))
	    	},
	    	removed: id => {
	      		this.removed('problems', id)
	    	}
	  	})

	  	this.onStop(() => {
		  	sub.stop()
		})
  	} else { // if there's a limit, aggregate results
  		Problems.rawCollection().aggregate([{
	  		'$match': {
	  			$or: [{
		       		type: 'feature'
		      	}, {
		        	type: 'bug'
		      	}],
		      	open: true,
		      	solved: false // skip all documents that won't be shown on the bounty page anyways
	  		}
	  	},
	  	{
	  		'$unwind': '$credit'
	  	},
	    {
	    	'$group': {
		       	'_id': '$_id',
		       	'header': { '$first': '$header' },
	            'locked': { '$first': '$locked' },
	        	'type': { '$first': '$type' },
	        	'open': { '$first': '$open' },
	        	'solved': { '$first': '$solved' },
		       	'credit': {
		       		'$push': '$credit'
		       	},
		       	'reward': {
		       		'$sum': '$credit.bounty'
		       	}
	    	}
	    },
	    {
	    	'$sort': {
	    		'reward': -1
	    	} 
	    }, {
	    	'$skip': skip
	    }, {
	    	'$limit': limit
	    }], (err, data) => {
	    	if (!err) {
	    		data.forEach(i => {
	    			this.added('problems', i._id, i)
	    		})
	    	}
	    })
  	}

  	this.ready()
})

Meteor.publish('problem', (id) => Problems.find({
	_id: id
}))

Meteor.publish('solvedProblems', () => Problems.find({
	solved: true,
	open: true
}))

Meteor.publish('problemComments', (id) => {
	if (id) {
		return ProblemComments.find({
			problemId: id
		})
	} else {
		return ProblemComments.find({})
	}
})


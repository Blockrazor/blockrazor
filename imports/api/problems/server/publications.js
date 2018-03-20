import { Meteor } from 'meteor/meteor'
import { Problems } from '../problems'
import { ProblemComments } from '../problemComments'

Meteor.publish('problems', () => Problems.find({}))
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


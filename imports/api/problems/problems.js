import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';
import { LocalizableCollection } from '../utilities'

let Problems = {}

if (!Meteor.isTest) {
	Problems = new LocalizableCollection('problems', "fetchProblems")
} else {
	Problems = new Mongo.Collection('problems')
}

export { Problems }

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Problems.schema = new SimpleSchema({
	_id: { type: Id },
	type: {type: String, allowedValues: ['bug', 'feature', 'question'] },
	header:  {type: String, max: 80 },
	text: { type: String },
	images: {type: Array, required: false},
	"images.$": { type: String },
	bounty: {type: Number, required: false},
	createdBy: { type: Id },
	date: { type: Integer },
	credit: { type: Array },
	"credit.$": { type: Object, required: false },
	"credit.$.userId": { type: Id },
	"credit.$.bounty": { type: Number },
	open: { type: Boolean },
	solved: { type: Boolean },
	taken: { type: Object },
	locked: { type: Boolean },
	cancelled: { type: Boolean },
	votes: { type: Array },
	"votes.$": { type: String },
	score: { type: Integer },
}, { requiredByDefault: developmentValidationEnabledFalse });

Problems.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});
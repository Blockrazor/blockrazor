import SimpleSchema from 'simpl-schema';
import { Tracker } from 'meteor/tracker';

const Feature = new SimpleSchema({
  featureName: { type: String, min: 6, max: 140,label:"Feature name must be 6 " }
}, { tracker: Tracker }).newContext();

export const FeatureValidate = function (data){
	return Feature.validate(data)
}
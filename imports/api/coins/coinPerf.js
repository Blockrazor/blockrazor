import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';


const CoinPerf = new Mongo.Collection('coinPerf');

export { CoinPerf }
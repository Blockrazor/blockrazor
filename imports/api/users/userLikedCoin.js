import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';


const UserPerf = new Mongo.Collection('userPerf');

export { UserPerf }
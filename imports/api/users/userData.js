import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const UserData = new Mongo.Collection('userdata')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

UserData.schema = new SimpleSchema({
  _id: { type: Id }, 
  moderator: { type: Integer }, 
  balance: { type: Number }, 
  approvedCurrencies: { type: Integer }, 
  createdTime: { type: Integer }, 
  sessionData: { type: Array }, 
  "sessionData.$": { type: Object },
  "sessionData.$.loggedIP": { type: String }, 
  "sessionData.$.headerData": { type: Object }, 
  "sessionData.$.headerData.x-forwarded-for": { type: String }, 
  "sessionData.$.headerData.x-forwarded-port": { type: String }, 
  "sessionData.$.headerData.x-real-ip": { type: String }, 
  "sessionData.$.headerData.x-forwarded-proto": { type: String }, 
  "sessionData.$.headerData.host": { type:String  }, 
  "sessionData.$.headerData.user-agent": { type: String }, 
   "sessionData.$.headerData.accept-language": { type: String }, 
  "sessionData.$.time": { type: Integer }, 
}, { requiredByDefault: developmentValidationEnabledFalse });

UserData.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
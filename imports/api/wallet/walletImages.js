import { Mongo } from 'meteor/mongo';
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema';

export const WalletImages = new Mongo.Collection('walletimages');

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

WalletImages.schema = new SimpleSchema({
  _id: { type: Id }, 
  currencyId: { type: Id },
  currencySlug: { type: String },
  currencyName: { type: String },
  imageOf: { type: String },
  createdAt: { type: Integer },
  createdBy: { type: Id },
  flags: { type: Integer },
  likes: { type: Integer },
  extension: { type: String },
  flaglikers: { type: Array },
  "flaglikers.$": { type: Id },
  approved: { type: Boolean },
  allImagesUploaded: { type: Boolean },
  approvedBy: { type: Id }
}, { requiredByDefault: developmentValidationEnabledFalse });

WalletImages.deny({
  insert() { return true; }, 
  update() { return true; }, 
  remove() { return true; }, 
});
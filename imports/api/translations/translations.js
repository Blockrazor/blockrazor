import { Mongo } from 'meteor/mongo'
import SimpleSchema from 'simpl-schema'

export const Translations = new Mongo.Collection('translations')

Translations.deny({
    insert: () => true, 
    update: () => true,
    remove: () => true,
})
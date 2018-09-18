import { Mongo } from 'meteor/mongo'
import { developmentValidationEnabledFalse } from '../indexDB'
import SimpleSchema from 'simpl-schema'

export const Encryption = new Mongo.Collection('encryption')

var { Integer, RegEx } = SimpleSchema
var { Id } = RegEx

Encryption.schema = new SimpleSchema({
    _id: {
        type: Id
    }, 
    decryptionKey: {
        type: String,
        optional: false
    },
    votes: {
        type: Array,
        optional: true
    },
    'votes.$': {
        type: Object
    },
    'votes.$.voterId': {
        type: Id
    },
    'votes.$.votedFor': {
        type: Id
    },
    finished: {
        type: Boolean,
        optional: true
    },
    winner: {
        type: Id,
        optional: true
    },
    canVote: {
        type: Array,
        optional: false
    },
    'canVote.$': {
        type: String
    },
    startedAt: {
        type: Date,
        optional: true
    }
}, {
    requiredByDefault: developmentValidationEnabledFalse
})

Encryption.deny({
    insert: () => true, 
    update: () => true,
    remove: () => true
})

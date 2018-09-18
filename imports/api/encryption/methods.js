import { Meteor } from 'meteor/meteor'
import { Encryption, UserData } from '/imports/api/indexDB.js'

import { sendMessage } from '/imports/api/activityLog/methods'

Meteor.methods({
    checkDeadmanTrigger: () => {
        let enc = Encryption.findOne({
            decryptionKey: {
                $exists: true
            },
            finished: {
                $ne: true
            },
            startedAt: {
                $exists: false
            }
        })

        if (enc) {
            let users = Meteor.users.find({}).fetch()

            let canVote = users.sort((i1, i2) => {
                let u1Info = UserData.findOne({
                    _id: i1._id
                })

                let u2Info = UserData.findOne({
                    _id: i2._id
                })

                return i2.balance - i1.balance
            })

            canVote = canVote.slice(0, Math.round(canVote.length * 0.9))

            Encryption.update({
                _id: enc._id
            }, {
                $set: {
                    finished: false,
                    canVote: canVote.map(i => i._id),
                    startedAt: new Date().getTime(),
                    votes: []
                }
            })
        }
    },
    deadmanTriggerVote: (voteFor) => {
        let enc = Encryption.findOne({
            finished: false
        })

        if (!enc) {
            throw new Meteor.Error('Error.', 'deadman.cant_vote')
        }

        if (enc.votes.some(i => i.voterId === Meteor.userId())) {
            throw new Meteor.Error('Error.', 'deadman.already_voted')
        }

        if (voteFor === Meteor.userId()) {
            throw new Meteor.Error('Error.', 'deadman.cant_vote_yourself')
        }

        if (!~enc.canVote.indexOf(Meteor.userId())) {
            throw new Meteor.Error('Error.', 'deadman.not_on_list')
        }

        let winner = ''

        const isFinished = ((enc.votes.length + 1) >= enc.canVote.length) || (new Date().getTime() - enc.startedAt > 60*60*24*3*1000) // voting lasts for 3 days
        if (isFinished) {
            let map = {}

            enc.votes.push({
                voterId: Meteor.userId(),
                votedFor: voteFor
            })
            
            enc.votes.forEach(i => map[i.votedFor] = (map[i.votedFor] || 0) + 1)

            let sorted = Object.keys(map).sort((i1, i2) => {
                let u2 = (UserData.findOne({
                    _id: i2
                }) || {})

                let u1 = (UserData.findOne({
                    _id: i1
                }) || {})

                return (map[i2] - map[i1]) || (u2.inputRanking - u1.inputRanking) || (u2.balance - u1.balance)
            }) 

            winner = sorted[0]

            sendMessage(winner, `You have been selected to take care of Blockrazor secrets. Your decryption key is: ${enc.decryptionKey}`)
        }

        Encryption.update({
            _id: enc._id
        }, {
            $push: {
                votes: {
                    voterId: Meteor.userId(),
                    votedFor: voteFor
                }
            },
            $set: {
                finished: isFinished,
                winner: winner
            }
        })

        return 'ok'
    }
})
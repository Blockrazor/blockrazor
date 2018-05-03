import { Meteor } from 'meteor/meteor'
import { Auctions } from '../auctions'
import { Bids } from '../bids'

Meteor.publish('auctions', () => Auctions.find({}))

Meteor.publish('auction', (auctionId) => Auctions.find({
    _id: auctionId
}))

Meteor.publish('bids', (auction) => Bids.find({
    auctionId: auction
}))

Meteor.publish('timeAuctions', (pastDays) => {
    return Auctions.find({
        closed: true,
        'options.timeout': {
            $gt: new Date().getTime() - pastDays*1000*60*60*24
        }
    }, {
        sort: {
            createdAt: -1
        }
    })
})
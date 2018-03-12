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


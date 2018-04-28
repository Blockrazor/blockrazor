import { Meteor } from 'meteor/meteor'
import { Bounties, BountyTypes } from '/imports/api/indexDB.js'

Meteor.publish('bounties', function() {
  return Bounties.find()
})

Meteor.publish('bounty', function(id) {
  return Bounties.find({_id: id})
})

Meteor.publish('visibleBounties', () => Bounties.find({
  pendingApproval: false
}))
Meteor.publish('bountytypes', function(type) {
  if(!type) {
    return BountyTypes.find();
  } else {
    return BountyTypes.find({type: type});
  }
});
['currency', 'hashpower', 'codebase', 'wallet', 'community'].forEach(i => {
  Meteor.publish(`${i}Bounty`, userId => Bounties.find({
    userId: Meteor.userId(),
    type: `new-${i}`
  }))
})

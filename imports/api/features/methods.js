import { Meteor } from 'meteor/meteor'
import { Currencies, Features, UserData } from '/imports/api/indexDB.js'
import { checkCaptcha } from '/imports/api/miscellaneous/methods'

var hasUserVoted = (id, direction) => {
	var feature = Features.findOne(id);

	if (direction === 'up') {
		return _.include(feature.appealVoted, Meteor.userId());
	} else if (direction === 'down') {
		return _.include(feature.downVoted, Meteor.userId());
	}
}

Meteor.methods({
  flag: function(id) {
    if(this.userId) {
      if(_.include(Features.findOne(id).flaggedBy, this.userId)) { throw new Meteor.Error('Error', 'You can only flag something once.') }
      Features.upsert(id, {
        $addToSet: {flaggedBy: this.userId},
        $inc: {flags: 1}
      });
      var flagRatio = Features.findOne(id).flags / Features.findOne(id).appealNumber;
      Features.upsert(id, {
        $set: {flagRatio: flagRatio}
      });
    } else {
      throw new Meteor.Error('Error', 'You must be signed in to flag something');
    }
  },
  portFeatures: () => {
    Features.find({}).fetch().forEach(i => {
      if (!i.currencySlug) {
        Features.update({
          _id: i._id
        }, {
          $set: {
            currencySlug: (Currencies.findOne({ _id: i.currencyId }) || {}).slug
          }
        })
      }
    })
  },
  newFeature: function(coinId, featureName, captcha) {
    if(this.userId){
      if(typeof featureName != "string") { throw new Meteor.Error('Error', 'Error') }
      if(featureName.length > 140 || featureName.length < 6) {
        throw new Meteor.Error('Error', 'That name is too long or too short.')
      }

    let added = Features.find({
      createdBy: this.userId,
      currencyId: coinId
    }).count()

    let canAdd = true

    if (added > 10) { // if the user has added more than 10 items
      let last = Features.findOne({
        createdBy: this.userId,
        currencyId: coinId
      }, {
        sort: {
          createdAt: -1
        }
      })

      canAdd = !(last && new Date(last.createdAt).getTime() > (new Date().getTime() - 259200000)) // 3 days have to pass between adding new if the user has added more than 10 features
    }

    if (canAdd) {
      const Future = require('fibers/future')
      const fut = new Future()
                
      checkCaptcha(captcha, fut, this.connection.clientAddress)

      if (fut.wait()) {
        Features.insert({
          currencyId: coinId,
          currencySlug: (Currencies.findOne({ _id: coinId }) || {}).slug,
          featureName: featureName,
          appeal: 2,
          appealNumber: 2,
          appealVoted: [this.userId],
          flags: 0,
          flagRatio: 0,
          flaggedBy: [],
          commenters: [],
          createdAt: Date.now(),
          author: Meteor.user().username,
          createdBy: this.userId,
          rating: 1
        })

        UserData.update({
          _id: this.userId
        }, {
          $push: {
            activity: {
              time: new Date().getTime(),
              type: 'feature'
            }
          }
        })
      } else {
        throw new Meteor.Error('Error.', 'Invalid captcha.')
      }
    } else {
      throw new Meteor.Error('Error.', 'You have to wait until you can post another feature.')
    }

  } else {throw new Meteor.Error('Error', 'You must be signed in to add a new feature')}
},

newComment: function(parentId, comment, depth, captcha) {
  if(this.userId){
    if(typeof comment != "string") { throw new Meteor.Error('Error', 'Error') }
    if(typeof depth != "number") { throw new Meteor.Error('Error', 'Error') }
    if(comment.length > 140 || comment.length < 6) {
      throw new Meteor.Error('Error', 'That comment is too long or too short.')
    }
    if(_.include(Features.findOne(parentId).commenters, this.userId)) {
      throw new Meteor.Error('Error', 'You are only allowed to comment once on any feature')
    }

    const Future = require('fibers/future')
      const fut = new Future()
                
      checkCaptcha(captcha, fut, this.connection.clientAddress)

      if (fut.wait()) {
  Features.insert({
    parentId: parentId,
    comment: comment,
    appeal: 2,
    appealNumber: 2,
    appealVoted: [this.userId],
    flags: 0,
    flagRatio: 0,
    flaggedBy: [],
    commenters: [],
    createdAt: Date.now(),
    author: Meteor.user().username,
    createdBy: this.userId,
    depth: depth,
    rating: 1
  })

  UserData.update({
        _id: this.userId
      }, {
        $push: {
          activity: {
            time: new Date().getTime(),
            type: 'comment'
          }
        }
      })
  Features.upsert(parentId, {
    $addToSet: {commenters: this.userId}
  })
  } else {
        throw new Meteor.Error('Error.', 'Invalid captcha.')
      }

} else {throw new Meteor.Error('Error', 'You must be signed in to comment')}
}
});

import { Meteor } from 'meteor/meteor'
import { Currencies, Features, UserData, developmentValidationEnabledFalse } from '/imports/api/indexDB.js'
import { checkCaptcha } from '/imports/api/miscellaneous/methods'
import { sendMessage } from '/imports/api/activityLog/methods'
import SimpleSchema from 'simpl-schema';

const featureSchema = new SimpleSchema({
    featureName: {
        type: String,
        min: 6,
        max: 140,
        label: 'Feature name',
        optional: false
    },
    coinId: {
        type: SimpleSchema.RegEx.Id
    },
    captcha: {
        type: String,
        optional: true
    }
}, {
    requiredByDefault: developmentValidationEnabledFalse
})

export const newFeature = new ValidatedMethod({
    name: 'newFeature',
    validate: featureSchema.validator({
        clean: true
    }),
    run({coinId, featureName, captcha}) {
        if (Meteor.userId()) {
            let added = Features.find({
                createdBy: Meteor.userId(),
                currencyId: coinId
            }).count()

            let canAdd = true

            if (added > 10) { // if the user has added more than 10 items
                let last = Features.findOne({
                    createdBy: Meteor.userId(),
                    currencyId: coinId
                }, {
                    sort: {
                        createdAt: -1
                    }
                })

                canAdd = !(last && new Date(last.createdAt).getTime() > (new Date().getTime() - 259200000)) // 3 days have to pass between adding new if the user has added more than 10 features
            }

            if (canAdd) {
                if (Meteor.isServer) {
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
                            appealVoted: [Meteor.userId()],
                            flags: 0,
                            flagRatio: 0,
                            flaggedBy: [],
                            commenters: [],
                            createdAt: Date.now(),
                            author: Meteor.user().username,
                            createdBy: Meteor.userId(),
                            rating: 1
                        })

                        UserData.update({
                            _id: Meteor.userId()
                        }, {
                            $push: {
                                activity: {
                                    time: new Date().getTime(),
                                    type: 'feature'
                                }
                            }
                        })
                    } else {
                        throw new Meteor.Error('Error.', 'messages.features.captcha')
                    }
                }
            } else {
                throw new Meteor.Error('Error.', 'messages.features.wait')
            }
        } else {
            throw new Meteor.Error('Error', 'messages.login')
        }
    }
})

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
      if(_.include(Features.findOne(id).flaggedBy, this.userId)) { throw new Meteor.Error('Error', 'messages.features.flag_once') }
      Features.upsert(id, {
        $addToSet: {flaggedBy: this.userId},
        $inc: {flags: 1}
      });
      var flagRatio = Features.findOne(id).flags / Features.findOne(id).appealNumber;
      Features.upsert(id, {
        $set: {flagRatio: flagRatio}
      });
    } else {
      throw new Meteor.Error('Error', 'messages.login');
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

newComment: function(parentId, comment, depth, captcha) {
  if(this.userId){
    if(typeof comment != "string") { throw new Meteor.Error('Error', 'Error') }
    if(typeof depth != "number") { throw new Meteor.Error('Error', 'Error') }
    if(comment.length > 140 || comment.length < 6) {
      throw new Meteor.Error('Error', 'messages.features.too_short')
    }
    if(_.include(Features.findOne(parentId).commenters, this.userId)) {
      throw new Meteor.Error('Error', 'messages.features.comment_once')
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

    let feature = Features.findOne({
      _id: parentId
    })

    let user = Meteor.users.findOne({
      _id: this.userId
    })

    let currency = Currencies.findOne({
      _id: feature.currencyId
    })

    sendMessage(feature.createdBy, `${user.username} has commented on your feature on ${currency.currencyName}.`, 'System', `/currency/${currency.slug}`)
  } else {
        throw new Meteor.Error('Error.', 'messages.features.captcha')
      }

} else {throw new Meteor.Error('Error', 'messages.login')}
}
});

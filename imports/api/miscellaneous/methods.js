import { Meteor } from 'meteor/meteor'
import { FormData, Features, Redflags, UserData } from '/imports/api/indexDB.js'
import { AlphaLaunchSubscribers } from './alphaLaunchSubscribers'

const checkCaptcha = (captcha, fut, ip) => {
  if (typeof captcha !== 'undefined' && captcha !== 'pass') {
    const Recaptcha = require('recaptcha-v2').Recaptcha
    let recaptcha = new Recaptcha('6LerhE8UAAAAAB69iG94LAW_VdqrkZKienW79EUx', '6LerhE8UAAAAAOHiYbyUK84SHS8O9CN_EOrwXWVV', {
      remoteip:  ip,
      response:  captcha,
      secret: '6LerhE8UAAAAAOHiYbyUK84SHS8O9CN_EOrwXWVV'
    })
    recaptcha.verify((success, error_code) => {
      if (success) {
        fut.return(true)
      } else {
        fut.return(false)
        throw new Meteor.Error('Error.', 'messages.misc.captcha')
      }
    })
  } else {
    fut.return(true)
  }
}

export { checkCaptcha }

  Meteor.methods({
    insertFormData(data) {
      FormData.insert(data, function (error, result) {
        if (!result) {
          console.log(error);
          //return error;
          throw new Meteor.Error('Invalid', error);
        } else {
          //console.log(error);
          //console.log(result);
          return "OK";
        }
      });
    },
    flaggedVote: function(id, type, what) {
      if (!Meteor.userId()) {
        throw new Meteor.Error('Error.', 'messages.login')
      }

      let mod = UserData.findOne({
        _id: this.userId
      }, {
        fields: {
          moderator: true
        }
      })

      if (!mod || !mod.moderator) {
          throw new Meteor.Error('Error.', 'mod-only')
      }

      let Type

      if (what === 'features') {
        Type = Features
      } else if (what === 'redflags') {
        Type = Redflags
      } else if (what === 'comment') {
        Type = !!Features.findOne({
          _id: id
        }) ? Features : Redflags
      } else {
        throw new Meteor.Error('Error.', 'messages.misc.invalid_type')
      }
        
      let u = Type.findOne({
        _id: id
      })

      if (!((u.mod || {}).votes || []).filter(i => i.userId === this.userId).length) { // user hasn't voted yet
        Type.update({
          _id: u._id
        }, {
          $inc: {
            'mod.score': type === 'voteUp' ? 1 : -1, // increase or decrease the current score
            [`mod.${type === 'voteUp' ? 'upvotes' : 'downvotes'}`]: 1 // increase upvotes or downvotes
          },
          $push: {
            'mod.votes': {
              userId: this.userId,
              type: type,
              loggedIP: this.connection.clientAddress,
              time: new Date().getTime()
            }
          }
        })
      }
           
      let approveChange = Type.find({
        _id: u._id
      }, {
        fields: {
          mod: 1
        } 
      }).fetch()[0]

      // remove the flagged feature/redflag/comment if it receives 2 upvotes
      if ((approveChange.mod || {}).score >= 2) {
        Type.remove({
          _id: u._id
        })

        Meteor.call('userStrike', u.createdBy, what, 's3rv3r-only', (err, data) => {}) // user earns 1 strike here

        return 'ok'
      }

      // reset the flag ratio and flags if it receives more than 2 downvotes
      if ((approveChange.mod || {}).score <= -2) {
        if (u) {
          Type.update({
            _id: u._id
          }, {
            $set: {
              flags: 0,
              flagRatio: 0,
              flaggedBy: []
            }
          })
        } else {
          throw new Meteor.Error('Error.', 'messages.misc.wrong_id')
        }
                
        return 'not-ok'
      }
    },
    subscribeForAlphaLaunch: (mail) => {
      return AlphaLaunchSubscribers.upsert({}, {$addToSet: {subscribers: mail}})
    }
  })

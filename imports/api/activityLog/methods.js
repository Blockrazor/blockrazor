import { Meteor } from 'meteor/meteor'
import { ActivityLog, ActivityIPs, UserData } from '/imports/api/indexDB.js'
import { log } from '/imports/api/utilities'

export const sendMessage = function(userId, message, from, href, related) {
    ActivityLog.insert({
      time: new Date().getTime(),
      owner: userId,
      type: 'message',
      from: from ? from : "System",
      content: message,
      href: href || '',
      related: related || ''
    })
  }

Meteor.methods({
  initializeActivityLog: function() {
    if (_.size(ActivityLog.findOne({owner: this.userId})) == 0) {
      ActivityLog.insert({
        time: new Date().getTime(),
        owner: this.userId,
        type: "message",
        from: "System",
        content: "Your account has been created!"
      })
      }
    }
});

Meteor.methods({
    'markNotificationsAsRead': function() {
        if (!Meteor.userId()) { throw new Meteor.Error('Error.', 'messages.login') };

        ActivityLog.update({
            owner: Meteor.userId(),
        }, {
            $set: {
                read: true
            }
        }, {
            multi: true
        }, function(error) {
            if (error) {
                log.error('Error in markNotificationsAsRead', error)
                throw new Meteor.Error(500, error.message);
            }
        });

    }

})

Meteor.methods({
  activityIPFixture: () => {
    let ip = ActivityIPs.findOne({
      ip: '127.0.0.1'
    })

    if (!ip) {
      ActivityIPs.insert({
        ip: '127.0.0.1',
        ignored: true,
        whitelist: true
      })
    } else if (ip && (!ip.whitelist || !ip.ignored)) {
      ActivityIPs.update({
        _id: ip._id,
      }, {
        $set: {
          ignored: true,
          whitelist: true
        }
      })
    }
  },
  activityIPVote: function(ip, type) {
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
        
    let activityIP = ActivityIPs.findOne({
      ip: ip
    })

    const Future = require('fibers/future')
    let fut = new Future()

    if (!activityIP) { // if it still doesn't exist, create it
      ActivityIPs.insert({
        ip: ip,
        votes: [],
        score: 0,
        upvotes: 0,
        downvotes: 0
      }, (err, data) => {
        if (!err) {
          fut.return(ActivityIPs.findOne({
            _id: data
          }))
        } else {
          throw new Meteor.Error('Error', 'messages.error')
        }
      })
    } else {
      fut.return(activityIP)
    }

    activityIP = fut.wait()

    if (activityIP.ignored && activityIP.time > (new Date() - 1000*60*60*24*30)) {
      throw new Meteor.Error('Error', 'messages.activity.ip_ignored')
    }

    if (!(activityIP.votes || []).filter(i => i.userId === this.userId).length) { // user hasn't voted yet
      ActivityIPs.update({
        _id: activityIP._id
      }, {
        $inc: {
          score: type === 'voteUp' ? 1 : -1, // increase or decrease the current score
          [type === 'voteUp' ? 'upvotes' : 'downvotes']: 1 // increase upvotes or downvotes
        },
        $push: {
          votes: {
            userId: this.userId,
            type: type,
            loggedIP: this.connection.clientAddress,
            time: new Date().getTime()
          }
        }
      })
    }
           
    let approveChange = ActivityIPs.find({
      _id: activityIP._id
    }, {
      fields: {
        score: 1,
        upvotes: 1,
        downvotes: 1 
      } 
    }).fetch()[0]

    // ignore the IP for a month if the score is >= 3
    if (approveChange.score >= 3) {
      ActivityIPs.update({
        _id: activityIP._id
      }, {
        $set: {
          score: 0, // reset all vote related values
          upvotes: 0,
          downvotes: 0,
          votes: [],
          ignored: true,
          time: new Date().getTime()
        }
      })

      return 'ok'
    }

    // Ban all users <= -3
    if (approveChange.score <= -3) {
      let users = UserData.find({}).fetch().filter(i => {
        return i.sessionData && i.sessionData.some(j => j.loggedIP === ip) // IP was used by the user
      })

      users.forEach(i => {
        Meteor.call('userStrike', i._id, 'duplicate', 's3rv3r-only', 4, (err, data) => {}) // all users earn 4 strikes here
      })

      ActivityIPs.update({
        _id: activityIP._id
      }, {
        $set: {
          score: 0, // reset all vote related values
          upvotes: 0,
          downvotes: 0,
          votes: [],
          ignored: false,
          time: new Date().getTime()
        }
      })
                
      return 'not-ok'
    }
  }
})
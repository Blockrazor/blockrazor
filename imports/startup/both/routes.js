import {FlowRouter} from 'meteor/staringatlights:flow-router';
import {FastRender} from 'meteor/staringatlights:fast-render'
// import {SubsCache} from 'meteor/ccorcos:subs-cache'
import {SubsManager} from 'meteor/meteorhacks:subs-manager'

// SubsCache = new SubsManager({
//   cacheLimit: 30,
//   // expireIn will stop subscription after timer ends regardless if it's actually still being rendered or not
//   expireIn: 5555555555555555555555555555555555,
// }); // is 5 minutes, and 10 subs by default for subs-cache not manager packages

SubsCache = Meteor
SubsCache.ready = function() {return true}
if (Meteor.isClient) { // only import them if this code is being executed on client side
    //ubiquitous components
    import '../../ui/components/loading'
    import '../../ui/components/empty.html'

    //pages
  import '../../ui/layouts/MainBody.html'
  import '../../ui/pages/changedCurrencies/changedCurrencies.js'
  import '../../ui/pages/allHashpower/allHashpower'
  import '../../ui/pages/compareCurrencies/compareCurrencies'
  import '../../ui/pages/userProfile/userProfile'
  import '../../ui/pages/transactions/transactions'
  import '../../ui/pages/returnedCurrencies/returnedCurrencies.js'
  import '../../ui/pages/ratings/ratings.js'
  import '../../ui/pages/theme.html'
  import '../../ui/pages/communities/communities'
  import '../../ui/pages/codebase/codebase'
  import '../../ui/pages/developers/developers'
  import '../../ui/pages/editProfile/editProfile'
  import '../../ui/pages/bounties/bounties'
  import '../../ui/pages/addCoin/addCoin'
  import '../../ui/pages/currencyDetail/currencyDetail'
  import '../../ui/pages/userPendingCurrencies/userPendingCurrencies'
  import '../../ui/pages/activityLog/activityLog'
  import '../../ui/pages/wallet/wallet'
  import '../../ui/pages/signin/signin'
  import '../../ui/pages/signup/signup'
  import '../../ui/pages/auctions/currencyAuction'
  import '../../ui/pages/auctions/allAuctions'
  import '../../ui/pages/auctions/bidAuction'
  import '../../ui/pages/auctions/newAuction'
  import '../../ui/pages/problems/problems'
  import '../../ui/pages/problems/newProblem'
  import '../../ui/pages/problems/problem'
  import '../../ui/pages/allHashaverage/allHashaverage'
  import '../../ui/pages/addHashpower/addHashpower.js'
  import '../../ui/pages/suspended/suspended'


  //moderator pages
  import '../../ui/pages/moderator/moderatorDash/moderatorDash'
  import '../../ui/pages/moderator/questions/questions'
  import '../../ui/pages/moderator/flaggedUsers/flaggedUsers'
  import '../../ui/pages/moderator/hashpower/flaggedHashpower'
  import '../../ui/pages/moderator/appLogs/appLogs'
  import '../../ui/pages/moderator/problems/solvedProblems'
  import '../../ui/pages/moderator/pardon/pardon'
  import '../../ui/pages/moderator/flagged/flagged'

  // New Layout doesn't use side Template.dynamic side
  import '../../ui/layouts/mainLayout/mainLayout'

  //Stylesheet
  //is in client folder
  // import '/imports/ui/stylesheets/lux.min.css';
} else {
  SubsCache = Meteor
}

//resets window position on navigation
FlowRouter.triggers.enter([ () => { window.scrollTo(0, 0); }, () => {
  Tracker.autorun(() => { // redirection should be reactive, hence the Tracker is used
    let user = Meteor.userId() && Meteor.users.findOne({
      _id: Meteor.userId()
    })

    if (user && user.suspended) {
      FlowRouter.go('/suspended') // redirect all suspended users here
    }
  })
} ])

//global subscriptions (on client side immidiately available)
FlowRouter.subscriptions = function() {
  this.register('publicUserData', SubsCache.subscribe('publicUserData'));
  this.register('graphdata', SubsCache.subscribe('graphdata'));

  // subscribe to bounties so user's can keep track of active bounties
  this.register('bounties', SubsCache.subscribe('bounties'));

  //subscribe to users so that people can switch out accounts with constellation's account module
  if (Meteor.isDevelopment){
    this.register('users', SubsCache.subscribe('users'))
  }
};

FlowRouter.route('/profile/:slug', {
  subscriptions: function (params) {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'))
    this.register('userdataSlug', SubsCache.subscribe('userdataSlug', params.slug))
    this.register('user', SubsCache.subscribe('user', params.slug))
    this.register('comments', SubsCache.subscribe('comments'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {
      main: 'userProfile'
    })
  }
})

FlowRouter.route('/profile', {
  name: 'profile',
  action: () => {
     FlowRouter.go('/profile/' + Meteor.user().slug)
  }
})

FlowRouter.route('/compareCurrencies/:currencies?', {
  name: 'compare-currencies',
  subscriptions: function (params) {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'))
    this.register('features', SubsCache.subscribe('features'))
    this.register('redflags', SubsCache.subscribe('redflags'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'compareCurrencies',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/currencyAuction', {
  name: 'currency-auction',
  subscriptions: function (params) {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'))
    this.register('auction', SubsCache.subscribe('auction', 'top-currency'))
    this.register('bids', SubsCache.subscribe('bids', 'top-currency'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'currencyAuction',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/auctions', {
  name: 'all-auction',
  subscriptions: function (params) {
    this.register('auctions', SubsCache.subscribe('auctions'))
    this.register('publicUserData', SubsCache.subscribe('publicUserData'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'allAuctions',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/auction/:id', {
  name: 'bid-auction',
  subscriptions: function (params) {
    this.register('users', SubsCache.subscribe('users'))
    this.register('auction', SubsCache.subscribe('auction', params.id))
    this.register('bids', SubsCache.subscribe('bids', params.id))
    this.register('publicUserData', SubsCache.subscribe('publicUserData'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'bidAuction',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/new-auction', {
  name: 'new-auction',
  subscriptions: function (params) {
    this.register('publicUserData', SubsCache.subscribe('publicUserData'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'newAuction',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/suspended', {
  name: 'suspended',
  subscriptions: function(params) {
    this.register('myUserData', SubsCache.subscribe('myUserData'))
  },
  action: (params, queryParams) => {
    let user = Meteor.userId() && Meteor.users.findOne({
      _id: Meteor.userId()
    })

    if (user && user.suspended) {
      BlazeLayout.render('suspended')
    } else {
      FlowRouter.go('/')
    }
  }
})

FlowRouter.route('/problems', {
  name: 'problems',
  subscriptions: function (params) {
    this.register('problems', SubsCache.subscribe('problems'))
    this.register('users', SubsCache.subscribe('users'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'problems',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/problem/:id', {
  name: 'problem',
  subscriptions: function (params) {
    this.register('problem', SubsCache.subscribe('problem', params.id))
    this.register('users', SubsCache.subscribe('users'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'problem',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/new-problem', {
  name: 'new-problem',
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'newProblem',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/transactions/:page?', {
  name: 'transactions',
  subscriptions: function (params) {
    this.register('users', SubsCache.subscribe('users'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'transactions',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/', {
  name: 'BLOCKRAZOR',
  subscriptions: function () {
    this.register('usersStats', SubsCache.subscribe('usersStats'))
    this.register('dataQualityCurrencies', SubsCache.subscribe('dataQualityCurrencies'));
    this.register('graphdata', SubsCache.subscribe('graphdata'))
  },
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'returnedCurrencies',
      //left: 'menu'
    });
  }
})

FlowRouter.route('/ratings', {
  name: 'ratings',
  subscriptions: function () {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'));
    this.register('ratings', SubsCache.subscribe('ratings'));
    this.register('walletBounty', SubsCache.subscribe('walletBounty'));
    this.register('walletimages', SubsCache.subscribe('walletimages'));
  },
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'ratings',
      //left: 'luxMenu'
    });
  }
})

FlowRouter.route('/theme', {
  name: 'theme',
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'theme',
      //left: 'luxMenu'
    });
  }
})

FlowRouter.route('/add-hashpower', {
  name: 'add-haspower',
  subscriptions: function () {
    this.register('formdata', SubsCache.subscribe('formdata'));
    this.register('hashhardware', SubsCache.subscribe('hashhardware'));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
    this.register('hashunits', SubsCache.subscribe('hashunits'));
    this.register('hashpowerBounty', SubsCache.subscribe('hashpowerBounty'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'addHashpower',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/avg-hashpower', {
  name: 'avg-haspower',
  subscriptions: function () {
    this.register('hashaverage', SubsCache.subscribe('hashaverage'));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'allHashaverage',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/hashpower', {
  name: 'haspower',
  subscriptions: function () {
    this.register('hashpower', SubsCache.subscribe('hashpower'));
    this.register('hashhardware', SubsCache.subscribe('hashhardware'));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
    this.register('hashunits', SubsCache.subscribe('hashunits'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'allHashpower',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/communities', {
  name: 'communities',
  subscriptions: function () {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'));
    this.register('ratings', SubsCache.subscribe('ratings'));
    this.register('communityBounty', SubsCache.subscribe('communityBounty'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'communities',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/codebase', {
  name: 'codebase',
  subscriptions: function () {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'));
    this.register('ratings', SubsCache.subscribe('ratings'));
    this.register('codebaseBounty', SubsCache.subscribe('codebaseBounty'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'codebase',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/developers', {
  name: 'developers',
  subscriptions: function () {
    this.register('developers', SubsCache.subscribe('developers'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'developers',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/bounties', {
  name: 'bounties',
  subscriptions: function () {
    this.register('bounties', SubsCache.subscribe('bounties'))
    this.register('users', SubsCache.subscribe('users'))
    this.register('problems', SubsCache.subscribe('problems'))
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'))
    this.register('bountytypes', SubsCache.subscribe('bountytypes'));
  },
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'bounties',
      //left: 'sideNav'
    });
    //  if(Meteor.isServer) {    }
  }
});

FlowRouter.route('/bounties/:_id', {
  name: 'CurrencyDetail',
  subscriptions: function (params) {
    this.register('bounties', SubsCache.subscribe('bounties', params._id));
  },
  action: function (params, queryParams) {
    console.log("rendering activeBounty");
    BlazeLayout.render('mainLayout', {
      main: 'activeBounty',
      //left: 'sideNav'
    });
    console.log("finished rendering activeBounty");
  }
});

FlowRouter.route('/addcoin', {
  name: 'addcoin',
  subscriptions: function () {
    this.register('currencyBounty', SubsCache.subscribe('currencyBounty'));
    this.register('addCoinQuestions', SubsCache.subscribe('addCoinQuestions'));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
    this.register('exchanges', SubsCache.subscribe('exchanges'))
    // this.register('formdata', SubsCache.subscribe('formdata')); //userId isn't
    // availabe on server
  },
  action: function () {
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
    BlazeLayout.render('mainLayout', {
      main: 'addCoin',
      //left: 'luxMenu'
    });

      this.register('formdata', SubsCache.subscribe('formdata'));

    } else {
      // but if the user is not logged in, you have to redirect him to the login page
      // if we want to be able to redirect the user back to where he was, we have to
      // save the current path
      window.last = window.location.pathname
      // and go to the login page
      FlowRouter.go('/login')
    }
  }
})

FlowRouter.route('/currency/:slug', {
  name: 'CurrencyDetail',
  subscriptions: function (param) {
    this.register('approvedcurrency', SubsCache.subscribe('approvedcurrency', param.slug));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
    this.register('graphdata', SubsCache.subscribe('graphdata'))
    this.register('formdata', SubsCache.subscribe('formdata'))
    this.register('summaries', SubsCache.subscribe('summaries'), param.slug)
    this.register('bounties', SubsCache.subscribe('bounties'))
    this.register('exchanges', SubsCache.subscribe('exchanges'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {
      main: 'currencyDetail',
      //left: 'sideNav',
      bottom: 'edit'
    });
  }
});

FlowRouter.route('/mypending', {
  subscriptions: function () {
    this.register('bounties', SubsCache.subscribe('bounties'));
    this.register('pendingcurrencies', SubsCache.subscribe('pendingcurrencies'));
    this.register('rejectedcurrencies', SubsCache.subscribe('rejectedcurrencies'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'userPendingCurrencies'});
  }
});

FlowRouter.route('/changedcurrencies', {
  subscriptions: function () {
    this.register('changedCurrencies', SubsCache.subscribe('changedCurrencies'))
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {
      main: 'changedCurrencies',
      //left: 'luxMenu'
    });
  }
});

FlowRouter.route('/notifications', {
  subscriptions: function () {
    this.register('activitylog', SubsCache.subscribe('activitylog'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'activityLog'});
  }
});

FlowRouter.route('/wallet', {
  subscriptions: function () {
    this.register('wallet', SubsCache.subscribe('wallet'));
    this.register('users', SubsCache.subscribe('users'));
    this.register("publicUserData", SubsCache.subscribe("publicUserData"))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'wallet'});
  }
});

FlowRouter.route('/m', {
  name: 'mobile',
  subscriptions: function () {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'));
  },
  action() {
    BlazeLayout.render('mobile', {
      main: 'returnedCurrencies',
      top: 'sideNav'
    });
    console.log("Rendered mobile");
  }
});

FlowRouter.route('/login', {
  name: 'login',
  action: () => {
    if (!Meteor.userId()) {
      BlazeLayout.render('signin')
    } else {
      FlowRouter.go('/')
    }
  }
})

FlowRouter.route('/signup', {
  name: 'signup',
  action: () => {
    if (!Meteor.userId()) {
      BlazeLayout.render('signup')
    } else {
      FlowRouter.go('/')
    }
  }
})

// the App_notFound template is used for unknown routes and missing lists
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('error', {main: 'App_notFound'});
  }
};


//moderator routes
var adminRoutes = FlowRouter.group({
  prefix: '/moderator',
  name: 'moderator',
});

adminRoutes.route('/', {
  subscriptions: function () {
    this.register('pendingcurrencies', SubsCache.subscribe('pendingcurrencies'));
    this.register('bounties', SubsCache.subscribe('bounties'));
    this.register('walletimages', SubsCache.subscribe('walletimages'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'moderatorDash'});
  }
});

adminRoutes.route('/questions', {
  name: 'questions',
  subscriptions: function () {
    this.register('ratings_templates', SubsCache.subscribe('ratings_templates'));
  },
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'questions',
      //left: 'sideNav'
    });
    //  if(Meteor.isServer) {    }
  }
});

adminRoutes.route('/flagged-users', {
  name: 'flaggedUsers',
  subscriptions: function () {
    this.register('userData', SubsCache.subscribe('userData'));
    this.register('users', SubsCache.subscribe('users'));
  },
  action: function () {
    if (Meteor.userId()) {
      BlazeLayout.render('mainLayout', {
        main: 'flaggedUsers',
        //left: 'sideNav'
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/flagged-hashpower', {
  name: 'flagged-hashpower',
  subscriptions: function () {
    this.register('flaggedhashpower', SubsCache.subscribe('flaggedhashpower'));
    this.register('hashhardware', SubsCache.subscribe('hashhardware'));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
    this.register('hashunits', SubsCache.subscribe('hashunits'));
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'flaggedHashpower',
      //left: 'sideNav'
    })
  }
})

adminRoutes.route('/pardon', {
  name: 'pardon',
  subscriptions: function () {
    this.register('users', SubsCache.subscribe('users'))
    this.register('pardonUserData', SubsCache.subscribe('pardonUserData'))
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'pardon'
    })
  }
})

adminRoutes.route('/flagged', {
  name: 'flagged',
  subscriptions: function () {
    this.register('users', SubsCache.subscribe('users'))
    this.register('features', SubsCache.subscribe('features'))
    this.register('redflags', SubsCache.subscribe('redflags'))
  },
  action: () => {
    BlazeLayout.render('mainLayout', {
      main: 'flagged'
    })
  }
})

adminRoutes.route('/applogs', {
  name: 'app-logs',
  subscriptions: function (params) {
    this.register('applogs', SubsCache.subscribe('applogs', 1, 50))
    this.register('users', SubsCache.subscribe('users'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'appLogs',
      //left: 'sideNav'
    })
  }
})

adminRoutes.route('/solved-problems', {
  name: 'solved-problems',
  subscriptions: function (params) {
    this.register('solvedProblems', SubsCache.subscribe('solvedProblems'))
    this.register('users', SubsCache.subscribe('users'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'solvedProblems',
      //left: 'sideNav'
    })
  }
})

// server side routes

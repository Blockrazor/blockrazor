import {FlowRouter} from 'meteor/staringatlights:flow-router';
import {FastRender} from 'meteor/staringatlights:fast-render'
import {SubsCache as Sub} from 'meteor/blockrazor:subscache-c4'


// FastRenderer = Meteor
// FastRenderer.ready = function() {return true}
if (Meteor.isClient) { // only import them if this code is being executed on client side
  SubsCache = new Sub(5, 30); // is 5 minutes, and 10 subs by default for subs-cache
  FastRenderer = {subscribe(){}} // stub out subscription calls since duplicate subscriptions with different params will not be considered one by SubsCache, and will break fast-render is there's disconnected between parameters used
  
    //ubiquitous components
    import '../../ui/components/loading.js'
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
  import '../../ui/pages/wallet/walletTransactions'
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
  import '../../ui/pages/distribution/distribution'
  import '../../ui/pages/faq/faq.html'


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
} else {
  FastRenderer = Meteor
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
  //convert global subscriptions back to SubsCache since they're unlikely to duplicated at some template with different params breaking fast-render
  let FastRender = SubsCache
  this.register('publicUserData', FastRenderer.subscribe('publicUserData'));
  this.register('graphdata', FastRenderer.subscribe('graphdata'));

  // subscribe to bounties so user's can keep track of active bounties
  this.register('bounties', FastRenderer.subscribe('bounties'));

  //subscribe to users so that people can switch out accounts with constellation's account module
  if (Meteor.isDevelopment){
    this.register('users', FastRenderer.subscribe('users'))
  }
};

FlowRouter.route('/profile/:slug', {
  subscriptions: function (params) {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('userdataSlug', FastRenderer.subscribe('userdataSlug', params.slug))
    this.register('user', FastRenderer.subscribe('user', params.slug))
    this.register('comments', FastRenderer.subscribe('comments'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {
      main: 'userProfile'
    })
  }
})
FlowRouter.route('/faq', {
  name: 'faq',
    action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'faq',
      //left: 'sideNav'
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
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
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
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('auction', FastRenderer.subscribe('auction', 'top-currency'))
    this.register('bids', FastRenderer.subscribe('bids', 'top-currency'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'currencyAuction',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/auctions', {
  name: 'all-auctions',
  subscriptions: function (params) {
    this.register('auctions', FastRenderer.subscribe('auctions'))
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
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
    this.register('users', FastRenderer.subscribe('users'))
    this.register('auction', FastRenderer.subscribe('auction', params.id))
    this.register('bids', FastRenderer.subscribe('bids', params.id))
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
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
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
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
    this.register('myUserData', FastRenderer.subscribe('myUserData'))
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
    this.register('users', FastRenderer.subscribe('users'))
    this.register('problems', FastRenderer.subscribe('problems'))
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
    this.register('problem', FastRenderer.subscribe('problem', params.id))
    this.register('users', FastRenderer.subscribe('users'))
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
    this.register('users', FastRenderer.subscribe('users'))
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
    this.register('usersStats', FastRenderer.subscribe('usersStats'))
    this.register('dataQualityCurrencies', FastRenderer.subscribe('dataQualityCurrencies', 15));
    this.register('graphdata', FastRenderer.subscribe('graphdata'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
  },
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'returnedCurrencies',
      //left: 'menu'
    });
  }
})

FlowRouter.route('/distribution', {
  name: 'distribution',
  action() {
    BlazeLayout.render('mainLayout', {
      main: 'distribution',
      //left: 'menu'
    })
  }
})

FlowRouter.route('/ratings', {
  name: 'ratings',
  subscriptions: function () {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
    this.register('ratings', FastRenderer.subscribe('ratings'));
    this.register('walletBounty', FastRenderer.subscribe('walletBounty'));
    this.register('walletimages', FastRenderer.subscribe('walletimages'));
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
    this.register('formdata', FastRenderer.subscribe('formdata'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
    this.register('hashpowerBounty', FastRenderer.subscribe('hashpowerBounty'));
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
    this.register('hashaverage', FastRenderer.subscribe('hashaverage'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
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
    this.register('hashpower', FastRenderer.subscribe('hashpower'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
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
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
    this.register('ratings', FastRenderer.subscribe('ratings'));
    this.register('communityBounty', FastRenderer.subscribe('communityBounty'));
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
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
    this.register('ratings', FastRenderer.subscribe('ratings'));
    this.register('codebaseBounty', FastRenderer.subscribe('codebaseBounty'));
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
    this.register('developers', FastRenderer.subscribe('developers'));
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
    this.register('visibleBounties', FastRenderer.subscribe('visibleBounties'))
    this.register('users', FastRenderer.subscribe('users'))
    this.register('bountyProblems', FastRenderer.subscribe('bountyProblems', 0, 0))
    this.register('bountyCurrencies', FastRenderer.subscribe('bountyCurrencies', 0, 0)) // set the limit to 0 for now, first param is limit, second is skip
    this.register('bountytypes', FastRenderer.subscribe('bountytypes'))
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
    this.register('bounties', FastRenderer.subscribe('bounties', params._id));
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
    this.register('currencyBounty', FastRenderer.subscribe('currencyBounty'));
    this.register('addCoinQuestions', FastRenderer.subscribe('addCoinQuestions'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('exchanges', FastRenderer.subscribe('exchanges'))
    // this.register('formdata', FastRenderer.subscribe('formdata')); //userId isn't
    // availabe on server
  },
  action: function () {
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
    BlazeLayout.render('mainLayout', {
      main: 'addCoin',
      //left: 'luxMenu'
    });

      this.register('formdata', FastRenderer.subscribe('formdata'));

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
    this.register('approvedcurrency', FastRenderer.subscribe('approvedcurrency', param.slug));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('graphdata', FastRenderer.subscribe('graphdata'))
    this.register('formdata', FastRenderer.subscribe('formdata'))
    this.register('summaries', FastRenderer.subscribe('summaries', param.slug))
    this.register('bounties', FastRenderer.subscribe('bounties'))
    this.register('exchanges', FastRenderer.subscribe('exchanges'))
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
    this.register('bounties', FastRenderer.subscribe('bounties'));
    this.register('pendingcurrencies', FastRenderer.subscribe('pendingcurrencies'));
    this.register('rejectedcurrencies', FastRenderer.subscribe('rejectedcurrencies'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'userPendingCurrencies'});
  }
});

FlowRouter.route('/changedcurrencies', {
  subscriptions: function () {
    this.register('changedCurrencies', FastRenderer.subscribe('changedCurrencies'))
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'))
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
    this.register('activitylog', FastRenderer.subscribe('activitylog'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'activityLog'});
  }
});

FlowRouter.route('/wallet', {
  subscriptions: function () {
    this.register('wallet', FastRenderer.subscribe('wallet'));
    this.register('users', FastRenderer.subscribe('users'));
    this.register("publicUserData", FastRenderer.subscribe("publicUserData"))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'wallet'});
  }
});

FlowRouter.route('/wallet/:currency', {
  subscriptions: function () {
    this.register('wallet', FastRenderer.subscribe('wallet'));
    this.register('users', FastRenderer.subscribe('users'));
    this.register("publicUserData", FastRenderer.subscribe("publicUserData"))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'walletTransactions'});
  }
});

FlowRouter.route('/m', {
  name: 'mobile',
  subscriptions: function () {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
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
    this.register('pendingcurrencies', FastRenderer.subscribe('pendingcurrencies'));
    this.register('bounties', FastRenderer.subscribe('bounties'));
    this.register('walletimages', FastRenderer.subscribe('walletimages'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('mainLayout', {main: 'moderatorDash'});
  }
});

adminRoutes.route('/questions', {
  name: 'questions',
  subscriptions: function () {
    this.register('ratings_templates', FastRenderer.subscribe('ratings_templates'));
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
    this.register('userData', FastRenderer.subscribe('userData'));
    this.register('users', FastRenderer.subscribe('users'));
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
    this.register('flaggedhashpower', FastRenderer.subscribe('flaggedhashpower'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
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
    this.register('users', FastRenderer.subscribe('users'))
    this.register('pardonUserData', FastRenderer.subscribe('pardonUserData'))
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
    this.register('users', FastRenderer.subscribe('users'))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
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
    this.register('applogs', FastRenderer.subscribe('applogs', 1, 50))
    this.register('users', FastRenderer.subscribe('users'))
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
    this.register('solvedProblems', FastRenderer.subscribe('solvedProblems'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('mainLayout', {
      main: 'solvedProblems',
      //left: 'sideNav'
    })
  }
})

// server side routes

import {FlowRouter} from 'meteor/ostrio:flow-router-extra';
import {FastRender} from 'meteor/staringatlights:fast-render'
import {SubsCache as Sub} from 'meteor/blockrazor:subscache-c4'

// FastRenderer = Meteor
// FastRenderer.ready = function() {return true}
if (Meteor.isClient) { // only import them if this code is being executed on client side
  SubsCache = new Sub(5, 30); // is 5 minutes, and 10 subs by default for subs-cache
  FastRenderer = {subscribe(){}} // stub out subscription calls since duplicate subscriptions with different params will not be considered one by SubsCache, and will break fast-render is there's disconnected between parameters used
  
  // ubiquitous components
  import '/imports/ui/components/loading'
  import '/imports/ui/components/empty.html'

  // pages
  import '/imports/ui/layouts/MainBody.html'

  // New Layout doesn't use side Template.dynamic side
  import '/imports/ui/layouts/mainLayout/mainLayout'

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
      if (!~['problems', 'problem', 'new-problem'].indexOf(FlowRouter.getRouteName())) { // let suspended users access problems page
        FlowRouter.go('/suspended') // redirect all suspended users here
      }
    }
  })
} ])

//global subscriptions (on client side immidiately available)
FlowRouter.subscriptions = function() {
  //convert global subscriptions back to SubsCache since they're unlikely to duplicated at some template with different params breaking fast-render
  let sub = Meteor.isClient? SubsCache: Meteor
  this.register('publicUserData', sub.subscribe('publicUserData'));
  this.register('graphdata', sub.subscribe('graphdata'));

  // subscribe to bounties so user's can keep track of active bounties
  this.register('bounties', sub.subscribe('bounties'));

  //subscribe to users so that people can switch out accounts with constellation's account module
  if (Meteor.isDevelopment){
    this.register('users', sub.subscribe('users'))
  }
};

FlowRouter.route('/profile/:slug', {
  subscriptions: function (params) {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('userdataSlug', FastRenderer.subscribe('userdataSlug', params.slug))
    this.register('user', FastRenderer.subscribe('user', params.slug))
    this.register('comments', FastRenderer.subscribe('comments'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/userProfile/userProfile')
    BlazeLayout.render('mainLayout', {
      main: 'userProfile'
    })
  }
})

FlowRouter.route('/faq', {
  name: 'faq',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/faq/faq')
    BlazeLayout.render('mainLayout', {
      main: 'faq'
    })
  }
})

FlowRouter.route('/profile', {
  name: 'profile',
  action: async (params, queryParams) => {
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
  action: async (params, queryParams) => {
    await import ( '/imports/ui/pages/compareCurrencies/compareCurrencies')
    BlazeLayout.render('mainLayout', {
      main: 'compareCurrencies'
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/currencyAuction')
    BlazeLayout.render('mainLayout', {
      main: 'currencyAuction'
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/allAuctions')
    BlazeLayout.render('mainLayout', {
      main: 'allAuctions'
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/bidAuction')
    BlazeLayout.render('mainLayout', {
      main: 'bidAuction'
    })
  }
})

FlowRouter.route('/new-auction', {
  name: 'new-auction',
  subscriptions: function (params) {
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/newAuction')
    BlazeLayout.render('mainLayout', {
      main: 'newAuction'
    })
  }
})

FlowRouter.route('/suspended', {
  name: 'suspended',
  subscriptions: function(params) {
    this.register('myUserData', FastRenderer.subscribe('myUserData'))
  },
  action: async (params, queryParams) => {
    let user = Meteor.userId() && Meteor.users.findOne({
      _id: Meteor.userId()
    })

    if (user && user.suspended) {
      await import ('/imports/ui/pages/suspended/suspended')
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/problems/problems')
    BlazeLayout.render('mainLayout', {
      main: 'problems'
    })
  }
})

FlowRouter.route('/problem/:id', {
  name: 'problem',
  subscriptions: function (params) {
    this.register('problem', FastRenderer.subscribe('problem', params.id))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/problems/problem')
    BlazeLayout.render('mainLayout', {
      main: 'problem'
    })
  }
})

FlowRouter.route('/new-problem', {
  name: 'new-problem',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/problems/newProblem')
    BlazeLayout.render('mainLayout', {
      main: 'newProblem'
    })
  }
})

FlowRouter.route('/transactions/:page?', {
  name: 'transactions',
  subscriptions: function (params) {
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/transactions/transactions')
    BlazeLayout.render('mainLayout', {
      main: 'transactions'
    })
  }
})

FlowRouter.route('/', {
  name: 'home',
  subscriptions: function () {
    this.register('usersStats', FastRenderer.subscribe('usersStats'))
    this.register('dataQualityCurrencies', FastRenderer.subscribe('dataQualityCurrencies', 15));
    this.register('graphdata', FastRenderer.subscribe('graphdata'))
    this.register('redflagsHome', FastRenderer.subscribe('redflagsHome'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/returnedCurrencies/returnedCurrencies')
    BlazeLayout.render('mainLayout', {
      main: 'returnedCurrencies'
    })
  }
})

FlowRouter.route('/distribution', {
  name: 'distribution',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/distribution/distribution')
    BlazeLayout.render('mainLayout', {
      main: 'distribution'
    })
  }
})

FlowRouter.route('/exchanges', {
  name: 'exchanges',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/exchanges/exchanges')
    BlazeLayout.render('mainLayout', {
      main: 'exchanges',
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/ratings/ratings')
    BlazeLayout.render('mainLayout', {
      main: 'ratings'
    });
  }
})

FlowRouter.route('/theme', {
  name: 'theme',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/theme.html')
    BlazeLayout.render('mainLayout', {
      main: 'theme'
    })
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/addHashpower/addHashpower')
    BlazeLayout.render('mainLayout', {
      main: 'addHashpower'
    })
  }
})

FlowRouter.route('/avg-hashpower', {
  name: 'avg-haspower',
  subscriptions: function () {
    this.register('hashaverage', FastRenderer.subscribe('hashaverage'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/allHashaverage/allHashaverage')
    BlazeLayout.render('mainLayout', {
      main: 'allHashaverage'
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/allHashpower/allHashpower')
    BlazeLayout.render('mainLayout', {
      main: 'allHashpower'
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/communities/communities')
    BlazeLayout.render('mainLayout', {
      main: 'communities'
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
  action: async (params, queryParams) => {
    await import( '/imports/ui/pages/codebase/codebase')
    BlazeLayout.render('mainLayout', {
      main: 'codebase'
    })
  }
})

FlowRouter.route('/developers', {
  name: 'developers',
  subscriptions: function () {
    this.register('developers', FastRenderer.subscribe('developers'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/developers/developers')
    BlazeLayout.render('mainLayout', {
      main: 'developers'
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
    this.register('bountyRating', FastRenderer.subscribe('bountyRating'))
    this.register('bountyLastHash', FastRenderer.subscribe('bountyLastHash'))
    this.register('bountyLastCurrency', FastRenderer.subscribe('bountyLastCurrency'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/bounties/bounties')
    BlazeLayout.render('mainLayout', {
      main: 'bounties'
    })
  }
});

FlowRouter.route('/bounties/:_id', {
  name: 'bounties-id',
  subscriptions: function (params) {
    this.register('bounty', FastRenderer.subscribe('bounty', params._id));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/bounties/activeBounty')
    BlazeLayout.render('mainLayout', {
      main: 'activeBounty'
    })
  }
});

FlowRouter.route('/addcoin', {
  name: 'addcoin',
  subscriptions: function () {
    this.register('currencyBounty', FastRenderer.subscribe('currencyBounty'));
    this.register('addCoinQuestions', FastRenderer.subscribe('addCoinQuestions'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('exchanges', FastRenderer.subscribe('exchanges'))
    this.register('formdata', FastRenderer.subscribe('formdata'));
    // userId isn't availabe on server
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
      await import ('/imports/ui/pages/addCoin/addCoin')
      BlazeLayout.render('mainLayout', {
        main: 'addCoin'
      })
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

FlowRouter.route('/addcoin2', {
  name: 'addcoin2',
  subscriptions: function () {
    this.register('currencyBounty', FastRenderer.subscribe('currencyBounty'));
    this.register('addCoinQuestions', FastRenderer.subscribe('addCoinQuestions'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('exchanges', FastRenderer.subscribe('exchanges'))
    // this.register('formdata', FastRenderer.subscribe('formdata'));
    // userId isn't availabe on server
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      this.register('formdata', FastRenderer.subscribe('formdata'));
      // if the user is logged in, you can render the intented page
      await import ('../../ui/pages/addCoin/addCoin2')
      BlazeLayout.render('mainLayout', {
        main: 'addCoin2'
      })
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
  action: async (params, queryParams) => {
    await import( '/imports/ui/pages/currencyDetail/currencyDetail')
    BlazeLayout.render('mainLayout', {
      main: 'currencyDetail',
      bottom: 'edit'
    })
  }
});

FlowRouter.route('/mypending', {
  name: 'mypending',
  subscriptions: function () {
    this.register('bounties', FastRenderer.subscribe('bounties'));
    this.register('mypendingcurrencies', FastRenderer.subscribe('mypendingcurrencies'));
    this.register('myrejectedcurrencies', FastRenderer.subscribe('myrejectedcurrencies'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/userPendingCurrencies/userPendingCurrencies')
    BlazeLayout.render('mainLayout', {
      main: 'userPendingCurrencies'
    })
  }
});

FlowRouter.route('/changedcurrencies', {
  name: 'changedCurrencies',
  subscriptions: function () {
    this.register('changedCurrencies', FastRenderer.subscribe('changedCurrencies'))
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'))
  },
  action: async (params, queryParams) => {
    await import('/imports/ui/pages/changedCurrencies/changedCurrencies')
    BlazeLayout.render('mainLayout', {
      main: 'changedCurrencies'
    })
  }
});

FlowRouter.route('/notifications', {
  name: 'notifications',
  subscriptions: function () {
    this.register('activitylog', FastRenderer.subscribe('activitylog'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/activityLog/activityLog')
    BlazeLayout.render('mainLayout', {
      main: 'activityLog'
    })
  }
});

FlowRouter.route('/wallet', {
  name: 'wallet',
  subscriptions: function () {
    this.register('wallet', FastRenderer.subscribe('wallet'));
    this.register('users', FastRenderer.subscribe('users'));
    this.register("publicUserData", FastRenderer.subscribe("publicUserData"))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/wallet/wallet')
    BlazeLayout.render('mainLayout', {
      main: 'wallet'
    })
  }
});

FlowRouter.route('/wallet/:currency', {
  subscriptions: function () {
    this.register('wallet', FastRenderer.subscribe('wallet'));
    this.register('users', FastRenderer.subscribe('users'));
    this.register("publicUserData", FastRenderer.subscribe("publicUserData"))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/wallet/walletTransactions')
    BlazeLayout.render('mainLayout', {
      main: 'walletTransactions'
    })
  }
});

FlowRouter.route('/m', {
  name: 'mobile',
  subscriptions: function () {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/returnedCurrencies/returnedCurrencies')
    BlazeLayout.render('mobile', {
      main: 'returnedCurrencies',
      top: 'sideNav'
    })
  }
});

FlowRouter.route('/login', {
  name: 'login',
  action: async (params, queryParams) => {
    if (!Meteor.userId()) {
      await import ('/imports/ui/pages/signin/signin')
      BlazeLayout.render('signin')
    } else {
      FlowRouter.go('/')
    }
  }
})

FlowRouter.route('/signup', {
  name: 'signup',
  action: async (params, queryParams) => {
    if (!Meteor.userId()) {
      await import ('/imports/ui/pages/signup/signup')
      BlazeLayout.render('signup')
    } else {
      FlowRouter.go('/')
    }
  }
})

// the App_notFound template is used for unknown routes and missing lists
FlowRouter.notFound = {
  action: async (params, queryParams) => {
    BlazeLayout.render('error', {
      main: 'App_notFound'
    })
  }
};

//moderator routes
var adminRoutes = FlowRouter.group({
  prefix: '/moderator',
  name: 'moderator'
});

adminRoutes.route('/', {
  name: 'moderator',
  subscriptions: function () {
    this.register('pendingcurrencies', FastRenderer.subscribe('pendingcurrencies'));
    this.register('bounties', FastRenderer.subscribe('bounties'));
    this.register('walletimages', FastRenderer.subscribe('walletimages'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/moderatorDash/moderatorDash')
    BlazeLayout.render('mainLayout', {
      main: 'moderatorDash'
    })
  }
});

adminRoutes.route('/questions', {
  name: 'questions',
  subscriptions: function () {
    this.register('ratings_templates', FastRenderer.subscribe('ratings_templates'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/questions/questions')
    BlazeLayout.render('mainLayout', {
      main: 'questions'
    })
  }
});

adminRoutes.route('/flagged-users', {
  name: 'flaggedUsers',
  subscriptions: function () {
    this.register('userData', FastRenderer.subscribe('userData'));
    this.register('users', FastRenderer.subscribe('users'))
    this.register('activityIPs', FastRenderer.subscribe('activityIPs'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/flaggedUsers/flaggedUsers')
      BlazeLayout.render('mainLayout', {
        main: 'flaggedUsers'
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/candidates', {
  name: 'candidates',
  subscriptions: function () {
    this.register('userData', FastRenderer.subscribe('userData'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/candidates/candidates')
      BlazeLayout.render('mainLayout', {
        main: 'candidates'
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/flagged-ip/:ip', {
  name: 'flaggedIP',
  subscriptions: function (params) {
    this.register('userData', FastRenderer.subscribe('userData'))
    this.register('users', FastRenderer.subscribe('users'))
    this.register('activityIP', FastRenderer.subscribe('activityIP', params.ip))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('walletsMod', FastRenderer.subscribe('walletsMod'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/flaggedUsers/flaggedIP')
      BlazeLayout.render('mainLayout', {
        main: 'flaggedIP'
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/hashpower/flaggedHashpower')
    BlazeLayout.render('mainLayout', {
      main: 'flaggedHashpower'
    })
  }
})

adminRoutes.route('/pardon', {
  name: 'pardon',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('pardonUserData', FastRenderer.subscribe('pardonUserData'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/pardon/pardon')
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
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/flagged/flagged')
    BlazeLayout.render('mainLayout', {
      main: 'flagged'
    })
  }
})

adminRoutes.route('/applogs', {
  name: 'app-logs',
  subscriptions: function (params) {
    this.register('applogs', FastRenderer.subscribe('applogs', 1, 100))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/appLogs/appLogs')
    BlazeLayout.render('mainLayout', {
      main: 'appLogs'
    })
  }
})

adminRoutes.route('/solved-problems', {
  name: 'solved-problems',
  subscriptions: function (params) {
    this.register('solvedProblems', FastRenderer.subscribe('solvedProblems'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/problems/solvedProblems')
    BlazeLayout.render('mainLayout', {
      main: 'solvedProblems'
    })
  }
})

// server side routes

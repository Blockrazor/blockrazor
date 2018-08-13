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
  import '/imports/ui/layouts/layout.html'
  import '/imports/ui/shared/header/header.html'
  import '/imports/ui/shared/sidebar/sidebar.html'


  //Stylesheet
} else {
  FastRenderer = Meteor
}

FlowRouter.triggers.enter([function(options) {

    let breadcrumb = options.route.options.breadcrumb || "";

    //tried to do this in a parent reactiveVar but I couldn't get it to work
    Session.set('breadcrumbs', breadcrumb)
}])

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

    if (user && user.enabled2fa && !user.pass2fa && !window.isLoggingOut) {
      FlowRouter.go('/2fa')
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
  breadcrumb: 'Profile',
  subscriptions: function (params) {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('userdataSlug', FastRenderer.subscribe('userdataSlug', params.slug))
    this.register('user', FastRenderer.subscribe('user', params.slug))
    this.register('comments', FastRenderer.subscribe('comments'))
    this.register('userdata', FastRenderer.subscribe('userdata'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      // if the user is logged in, render the intented page
      await import ('/imports/ui/pages/userProfile/userProfile')
      await import ('/imports/ui/pages/editProfile/editProfile')
      BlazeLayout.render('layout', {
        main: 'userProfile',
        header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      // else redirect to the login page, saving the current path, to be able to redirect the user back
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

FlowRouter.route('/faq', {
  breadcrumb: 'Faq',
  name: 'faq',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/faq/faq')
    BlazeLayout.render('layout', {
      main: 'faq',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/profile', {
  breadcrumb: 'Home / Profile',
  name: 'profile',
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      // if the user is logged in, go to the intented page
      FlowRouter.go('/profile/' + Meteor.user().slug)
    } else {
      // else redirect to the login page, saving the current path, to be able to redirect the user back
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

FlowRouter.route('/compareCurrencies/:currencies?', {
  breadcrumb: 'Home / Compare Currencies',
  name: 'compare-currencies',
  subscriptions: function (params) {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
  },
  action: async (params, queryParams) => {
    await import ( '/imports/ui/pages/compareCurrencies/compareCurrencies')
    BlazeLayout.render('layout', {
      main: 'compareCurrencies',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/currencyAuction', {
  breadcrumb: 'Home / Auctions',
  name: 'currency-auction',
  subscriptions: function (params) {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
    this.register('auction', FastRenderer.subscribe('auction', 'top-currency'))
    this.register('bids', FastRenderer.subscribe('bids', 'top-currency'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/currencyAuction')
    BlazeLayout.render('layout', {
      main: 'currencyAuction',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/auctions', {
  breadcrumb: 'Home / All Auctions',
  name: 'all-auctions',
  subscriptions: function (params) {
    this.register('auctions', FastRenderer.subscribe('auctions'))
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/allAuctions')
    BlazeLayout.render('layout', {
      main: 'allAuctions',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/auction/:id', {
  name: 'bid-auction',
  breadcrumb: 'Home / Auctions',
  subscriptions: function (params) {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('auction', FastRenderer.subscribe('auction', params.id))
    this.register('bids', FastRenderer.subscribe('bids', params.id))
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/bidAuction')
    BlazeLayout.render('layout', {
      main: 'bidAuction',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/new-auction', {
  name: 'new-auction',
  breadcrumb: 'Home / New Auction',
  subscriptions: function (params) {
    this.register('publicUserData', FastRenderer.subscribe('publicUserData'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/auctions/newAuction')
    BlazeLayout.render('layout', {
      main: 'newAuction',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/suspended', {
  name: 'suspended',
  breadcrumb: 'Home / Suspended',
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
  breadcrumb: 'Home / Problems',
  subscriptions: function (params) {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('problems', FastRenderer.subscribe('problems'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/problems/problems')
    BlazeLayout.render('layout', {
      main: 'problems',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/problem/:id', {
  name: 'problem',
  breadcrumb: 'Home / View Problem',
  subscriptions: function (params) {
    this.register('problem', FastRenderer.subscribe('problem', params.id))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/problems/problem')
    BlazeLayout.render('layout', {
      main: 'problem',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/new-problem', {
  name: 'new-problem',
  breadcrumb: 'Home / New Problem',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/problems/newProblem')
    BlazeLayout.render('layout', {
      main: 'newProblem',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/transactions/:page?', {
  name: 'transactions',
  breadcrumb: 'Krazor / Transactions',
  subscriptions: function (params) {
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/transactions/transactions')
    BlazeLayout.render('layout', {
      main: 'transactions',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/', {
    name: 'home',
    breadcrumb: 'Home',
    subscriptions: function() {
        this.register('usersStats', FastRenderer.subscribe('usersStats'))
        this.register('dataQualityCurrencies', FastRenderer.subscribe('dataQualityCurrencies', 15));
        this.register('graphdata', FastRenderer.subscribe('graphdata'))
        this.register('redflagsHome', FastRenderer.subscribe('redflagsHome'))
    },
    action: async(params, queryParams) => {
        if (Meteor.userId()) {
            await
            import ('/imports/ui/pages/returnedCurrencies/returnedCurrencies')
            BlazeLayout.render("layout", {
                header: "header",
                sidebar: 'sidebar',
                footer: "footer",
                main: "returnedCurrencies"

            })

        } else {
            await
            import ('/imports/ui/pages/landingpage/landingpage')
            BlazeLayout.render("layout", {
                header: "header",
                footer: "footer",
                main: "landingpage"

            })
        }
    }
})



FlowRouter.route('/distribution', {
  name: 'distribution',
   breadcrumb: 'Krazor / Distribution',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/distribution/distribution')
    BlazeLayout.render('layout', {
      main: 'distribution',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/priceChart', {
  name: 'price-chart',
  breadcrumb: 'Krazor / Trade',
  subscriptions: function() {
    this.register('timeAuctions', FastRenderer.subscribe('timeAuctions', 9))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/prices/priceChart')
    BlazeLayout.render('layout', {
      main: 'priceChart',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/exchanges', {
  name: 'exchanges',
  breadcrumb: 'Home / Exchanges',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/exchanges/exchanges')
    BlazeLayout.render('layout', {
      main: 'exchanges',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/ratings', {
  name: 'ratings',
  breadcrumb: 'Home / Ratings',
  subscriptions: function () {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
    this.register('ratings', FastRenderer.subscribe('ratings'));
    this.register('walletBounty', FastRenderer.subscribe('walletBounty'));
    this.register('walletimages', FastRenderer.subscribe('walletimages'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/ratings/ratings')
    BlazeLayout.render('layout', {
      main: 'ratings',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    });
  }
})

FlowRouter.route('/theme', {
  name: 'theme',
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/theme.html')
    BlazeLayout.render('layout', {
      main: 'theme',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/add-hashpower', {
  name: 'add-haspower',
  breadcrumb: 'Home / Hashpower',
  subscriptions: function () {
    this.register('formdata', FastRenderer.subscribe('formdata'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
    this.register('hashpowerBounty', FastRenderer.subscribe('hashpowerBounty'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/addHashpower/addHashpower')
    BlazeLayout.render('layout', {
      main: 'addHashpower',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/avg-hashpower', {
  name: 'avg-haspower',
  breadcrumb: 'Home / Hashpower',
  subscriptions: function () {
    this.register('hashaverage', FastRenderer.subscribe('hashaverage'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/allHashaverage/allHashaverage')
    BlazeLayout.render('layout', {
      main: 'allHashaverage',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/hashpower', {
  name: 'haspower',
  breadcrumb: 'Home / Hashpower',
  subscriptions: function () {
    this.register('hashpower', FastRenderer.subscribe('hashpower'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/allHashpower/allHashpower')
    BlazeLayout.render('layout', {
      main: 'allHashpower',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/communities', {
  name: 'communities',
  breadcrumb: 'Home / Communities',
  subscriptions: function () {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
    this.register('ratings', FastRenderer.subscribe('ratings'));
    this.register('communityBounty', FastRenderer.subscribe('communityBounty'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/communities/communities')
    BlazeLayout.render('layout', {
      main: 'communities',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/codebase', {
  name: 'codebase',
  breadcrumb: 'Home / Codebase',
  subscriptions: function () {
    this.register('approvedcurrencies', FastRenderer.subscribe('approvedcurrencies'));
    this.register('ratings', FastRenderer.subscribe('ratings'));
    this.register('codebaseBounty', FastRenderer.subscribe('codebaseBounty'));
  },
  action: async (params, queryParams) => {
    await import( '/imports/ui/pages/codebase/codebase')
    BlazeLayout.render('layout', {
      main: 'codebase',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/developers', {
  name: 'developers',
  breadcrumb: 'Home / Developers',
  subscriptions: function () {
    this.register('developers', FastRenderer.subscribe('developers'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/developers/developers')
    BlazeLayout.render('layout', {
      main: 'developers',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

FlowRouter.route('/bounties', {
  name: 'bounties',
  breadcrumb: 'Home / Bounties',
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
    BlazeLayout.render('layout', {
      main: 'bounties',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

FlowRouter.route('/bounties/:_id', {
  name: 'bounties-id',
  breadcrumb: 'Home / View Bounty',
  subscriptions: function (params) {
    this.register('bounty', FastRenderer.subscribe('bounty', params._id));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/bounties/activeBounty')
    BlazeLayout.render('layout', {
      main: 'activeBounty',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

FlowRouter.route('/addcoin', {
  name: 'addcoin',
  breadcrumb: 'Home / Add Coin',
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
      BlazeLayout.render('layout', {
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
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

FlowRouter.route('/currency/:slug', {
  name: 'CurrencyDetail',
  breadcrumb: 'Home / Currency',
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
    BlazeLayout.render('layout', {
      main: 'currencyDetail',
      bottom: 'edit',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

FlowRouter.route('/mypending', {
  name: 'mypending',
  breadcrumb: 'Home / Pending Currencies',
  subscriptions: function () {
    this.register('bounties', FastRenderer.subscribe('bounties'));
    this.register('mypendingcurrencies', FastRenderer.subscribe('mypendingcurrencies'));
    this.register('myrejectedcurrencies', FastRenderer.subscribe('myrejectedcurrencies'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/userPendingCurrencies/userPendingCurrencies')
    BlazeLayout.render('layout', {
      main: 'userPendingCurrencies',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
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
    BlazeLayout.render('layout', {
      main: 'activityLog',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

FlowRouter.route('/wallet', {
  name: 'wallet',
    breadcrumb: 'Home / My Wallet',
  subscriptions: function () {
    this.register('wallet', FastRenderer.subscribe('wallet'));
    this.register('users', FastRenderer.subscribe('users'));
    this.register("publicUserData", FastRenderer.subscribe("publicUserData"))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/wallet/wallet')
    BlazeLayout.render('layout', {
      main: 'wallet',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

FlowRouter.route('/wallet/:currency', {
  breadcrumb: 'Home / My Wallet / Currency',
  subscriptions: function () {
    this.register('wallet', FastRenderer.subscribe('wallet'));
    this.register('users', FastRenderer.subscribe('users'));
    this.register("publicUserData", FastRenderer.subscribe("publicUserData"))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/wallet/walletTransactions')
    BlazeLayout.render('layout', {
      main: 'walletTransactions',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
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
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
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
      let user = Meteor.users.findOne({
        _id: Meteor.userId()
      })
      if (user.enabled2fa) {
        FlowRouter.go('/2fa')
      } else {
        FlowRouter.go('/')
      }
    }
  }
})

FlowRouter.route('/2fa', {
  name: '2fa',
  action: async (params, queryParams) => {
    if (!Meteor.userId()) {
      FlowRouter.go('/login')
    } else {
      let user = Meteor.users.findOne({
        _id: Meteor.userId()
      })

      if (user.enabled2fa && !user.pass2fa) {
        await import ('/imports/ui/pages/signin/twoFactor')

        BlazeLayout.render('twoFactor')
      } else {
        FlowRouter.go('/')
      }
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
FlowRouter.route('*',{
  action: async (params, queryParams) => {
    BlazeLayout.render('error', {
      main: 'App_notFound'
    })
  }
});



// moderator routes
var adminRoutes = FlowRouter.group({
  prefix: '/moderator',
  name: 'moderator'
});

adminRoutes.route('/', {
  name: 'moderator',
  breadcrumb: 'Moderator / Pending Currencies',
  subscriptions: function () {
    this.register('pendingcurrencies', FastRenderer.subscribe('pendingcurrencies'));
    this.register('walletimages', FastRenderer.subscribe('walletimages'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/moderatorDash/moderatorDash')
    BlazeLayout.render('layout', {
      main: 'moderatorDash',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutes.route('/changedcurrencies', {
  name: 'changedCurrencies',
  breadcrumb: 'Moderator / Changed Currencies',
  subscriptions: function () {
    this.register('changedCurrencies', FastRenderer.subscribe('changedCurrencies'))
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'))
  },
  action: async (params, queryParams) => {
    await import('/imports/ui/pages/moderator/changedCurrencies/changedCurrencies')
    BlazeLayout.render('layout', {
      main: 'changedCurrencies',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutes.route('/changedcurrencies/:id', {
  name: 'changedCurrency',
  breadcrumb: 'Moderator / Changed Currencies / Currency',
  subscriptions: function () {
    this.register('changedCurrencies', FastRenderer.subscribe('changedCurrencies'))
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'))
  },
  action: async (params, queryParams) => {
    await import('/imports/ui/pages/moderator/changedCurrencies/changedCurrency')
    BlazeLayout.render('layout', {
      main: 'changedCurrency',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutes.route('/questions', {
  name: 'questions',
  breadcrumb: 'Moderator / Questions',
  subscriptions: function () {
    this.register('ratings_templates', FastRenderer.subscribe('ratings_templates'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/questions/questions')
    BlazeLayout.render('layout', {
      main: 'questions',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutes.route('/flagged-users', {
  name: 'flaggedUsers',
  breadcrumb: 'Moderator / Flagged Users',
  subscriptions: function () {
    this.register('userData', FastRenderer.subscribe('userData'));
    this.register('users', FastRenderer.subscribe('users'))
    this.register('activityIPs', FastRenderer.subscribe('activityIPs'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/flaggedUsers/flaggedUsers')
      BlazeLayout.render('layout', {
      main: 'flaggedUsers',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/candidates', {
  name: 'candidates',
  breadcrumb: 'Moderator / Candidates',
  subscriptions: function () {
    this.register('userData', FastRenderer.subscribe('userData'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/candidates/candidates')
      BlazeLayout.render('layout', {
        main: 'candidates',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/exchanges', {
  name: 'exchanges-removal',
  breadcrumb: 'Moderator / Remove Exchanges',
  subscriptions: function () {
    this.register('modExchanges', FastRenderer.subscribe('modExchanges'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/exchanges/removeExchanges')
      BlazeLayout.render('layout', {
        main: 'removeExchanges',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/exchanges/:id', {
  name: 'exchange-removal',
  breadcrumb: 'Moderator / Remove Exchanges / Currency',
  subscriptions: function () {
    this.register('modExchanges', FastRenderer.subscribe('modExchanges'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderator/exchanges/removeExchange')
      BlazeLayout.render('layout', {
        main: 'removeExchange',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/flagged-ip/:ip', {
  name: 'flaggedIP',
  breadcrumb: 'Moderator / Flagged IP',
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
      BlazeLayout.render('layout', {
        main: 'flaggedIP',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutes.route('/flagged-hashpower', {
  name: 'flagged-hashpower',
  breadcrumb: 'Moderator / Flagged Hashpower',
  subscriptions: function () {
    this.register('flaggedhashpower', FastRenderer.subscribe('flaggedhashpower'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/hashpower/flaggedHashpower')
    BlazeLayout.render('layout', {
      main: 'flaggedHashpower',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutes.route('/pardon', {
  name: 'pardon',
  breadcrumb: 'Moderator / Pardon User',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('pardonUserData', FastRenderer.subscribe('pardonUserData'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/pardon/pardon')
    BlazeLayout.render('layout', {
      main: 'pardon',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutes.route('/pardon/:id', {
  name: 'pardonUser',
  breadcrumb: 'Moderator / Pardon User / User',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('pardonUserData', FastRenderer.subscribe('pardonUserData'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/pardon/pardonUser')
    BlazeLayout.render('layout', {
      main: 'pardonUser',
        header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutes.route('/flagged', {
  name: 'flagged',
  breadcrumb: 'Moderator / Flagged',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/flagged/flagged')
    BlazeLayout.render('layout', {
      main: 'flagged',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutes.route('/flagged/:collection/:id', {
  name: 'flaggedItem',
  breadcrumb: 'Moderator / Flagged / Item',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/flagged/flaggedItem')
    BlazeLayout.render('layout', {
      main: 'flaggedItem',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})



adminRoutes.route('/applogs', {
  name: 'app-logs',
  breadcrumb: 'Moderator / App Logs',
  subscriptions: function (params) {
    this.register('applogs', FastRenderer.subscribe('applogs', 1, 100))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/appLogs/appLogs')
    BlazeLayout.render('layout', {
      main: 'appLogs',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutes.route('/solved-problems', {
  name: 'solved-problems',
  breadcrumb: 'Moderator / Solved Problems',

  subscriptions: function (params) {
    this.register('solvedProblems', FastRenderer.subscribe('solvedProblems'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderator/problems/solvedProblems')
    BlazeLayout.render('layout', {
      main: 'solvedProblems',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})




// old moderator routes (for reference purposes only)
var adminRoutesOld = FlowRouter.group({
  prefix: '/moderatorOld',
  name: 'moderatorOld'
});

adminRoutesOld.route('/', {
  name: 'moderatorOld',
  subscriptions: function () {
    this.register('pendingcurrencies', FastRenderer.subscribe('pendingcurrencies'));
    this.register('walletimages', FastRenderer.subscribe('walletimages'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/moderatorDash/moderatorDash')
    BlazeLayout.render('layout', {
      main: 'moderatorDash',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutesOld.route('/changedcurrencies', {
  name: 'changedCurrenciesOld',
  subscriptions: function () {
    this.register('changedCurrencies', FastRenderer.subscribe('changedCurrencies'))
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'))
  },
  action: async (params, queryParams) => {
    await import('/imports/ui/pages/moderatorOld/changedCurrencies/changedCurrencies')
    BlazeLayout.render('layout', {
      main: 'changedCurrencies',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutesOld.route('/questions', {
  name: 'questionsOld',
  subscriptions: function () {
    this.register('ratings_templates', FastRenderer.subscribe('ratings_templates'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/questions/questions')
    BlazeLayout.render('layout', {
      main: 'questions',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
});

adminRoutesOld.route('/flagged-users', {
  name: 'flaggedUsersOld',
  subscriptions: function () {
    this.register('userData', FastRenderer.subscribe('userData'));
    this.register('users', FastRenderer.subscribe('users'))
    this.register('activityIPs', FastRenderer.subscribe('activityIPs'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderatorOld/flaggedUsers/flaggedUsers')
      BlazeLayout.render('layout', {
        main: 'flaggedUsers',
        header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutesOld.route('/candidates', {
  name: 'candidatesOld',
  subscriptions: function () {
    this.register('userData', FastRenderer.subscribe('userData'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderatorOld/candidates/candidates')
      BlazeLayout.render('layout', {
        main: 'candidates',
        header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutesOld.route('/exchanges', {
  name: 'exchanges-removalOld',
  subscriptions: function () {
    this.register('modExchanges', FastRenderer.subscribe('modExchanges'))
  },
  action: async (params, queryParams) => {
    if (Meteor.userId()) {
      await import ('/imports/ui/pages/moderatorOld/exchanges/removeExchanges')
      BlazeLayout.render('layout', {
        main: 'removeExchanges',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutesOld.route('/flagged-ip/:ip', {
  name: 'flaggedIPOld',
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
      await import ('/imports/ui/pages/moderatorOld/flaggedUsers/flaggedIP')
      BlazeLayout.render('layout', {
        main: 'flaggedIP',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

adminRoutesOld.route('/flagged-hashpower', {
  name: 'flagged-hashpowerOld',
  subscriptions: function () {
    this.register('flaggedhashpower', FastRenderer.subscribe('flaggedhashpower'));
    this.register('hashhardware', FastRenderer.subscribe('hashhardware'));
    this.register('hashalgorithm', FastRenderer.subscribe('hashalgorithm'));
    this.register('hashunits', FastRenderer.subscribe('hashunits'));
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/hashpower/flaggedHashpower')
    BlazeLayout.render('layout', {
      main: 'flaggedHashpower',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutesOld.route('/pardon', {
  name: 'pardonOld',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('pardonUserData', FastRenderer.subscribe('pardonUserData'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/pardon/pardon')
    BlazeLayout.render('layout', {
      main: 'pardon',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutesOld.route('/flagged', {
  name: 'flaggedOld',
  subscriptions: function () {
    this.register('users', FastRenderer.subscribe('users'))
    this.register('features', FastRenderer.subscribe('features'))
    this.register('redflags', FastRenderer.subscribe('redflags'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/flagged/flagged')
    BlazeLayout.render('layout', {
      main: 'flagged',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutesOld.route('/applogs', {
  name: 'app-logsOld',
  subscriptions: function (params) {
    this.register('applogs', FastRenderer.subscribe('applogs', 1, 100))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/appLogs/appLogs')
    BlazeLayout.render('layout', {
      main: 'appLogs',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})

adminRoutesOld.route('/solved-problems', {
  name: 'solved-problemsOld',
  subscriptions: function (params) {
    this.register('solvedProblems', FastRenderer.subscribe('solvedProblems'))
    this.register('users', FastRenderer.subscribe('users'))
  },
  action: async (params, queryParams) => {
    await import ('/imports/ui/pages/moderatorOld/problems/solvedProblems')
    BlazeLayout.render('layout', {
      main: 'solvedProblems',
      header: "header",
      sidebar: 'sidebar',
      footer: "footer",
    })
  }
})



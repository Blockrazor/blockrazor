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

  //moderator pages
  import '../../ui/pages/moderator/moderatorDash/moderatorDash'
  import '../../ui/pages/moderator/questions/questions'
  import '../../ui/pages/moderator/hashpower/allHashaverage'
  import '../../ui/pages/moderator/flaggedUsers/flaggedUsers'
  import '../../ui/pages/moderator/hashpower/flaggedHashpower'
  import '../../ui/pages/moderator/hashpower/addHashpower.js'

  // New Layout doesn't use side Template.dynamic side
  import '../../ui/layouts/mainLayout/mainLayout'

  //Stylesheet
  import '/imports/ui/stylesheets/lux.min.css';
} else {
  SubsCache = Meteor
}


//global subscriptions (on client side immidiately available)
FlowRouter.subscriptions = function() {
  this.register('publicUserData', SubsCache.subscribe('publicUserData'));
  this.register('graphdata', SubsCache.subscribe('graphdata'))
};

FlowRouter.route('/profile/:slug', {
  subscriptions: function (params) {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'))
    this.register('userdataSlug', SubsCache.subscribe('userdataSlug', params.slug))
    this.register('user', SubsCache.subscribe('user', params.slug))
    this.register('comments', SubsCache.subscribe('comments'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('desktop', {
      main: 'userProfile',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/compareCurrencies', {
  name: 'compare-currencies',
  subscriptions: function (params) {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'))
    this.register('features', SubsCache.subscribe('features'))
    this.register('redflags', SubsCache.subscribe('redflags'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('desktop', {
      main: 'compareCurrencies',
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
    BlazeLayout.render('desktop', {
      main: 'transactions',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/', {
  name: 'BLOCKRAZOR',
  subscriptions: function () {
    this.register('approvedcurrencies', SubsCache.subscribe('approvedcurrencies'));
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
    BlazeLayout.render('luxDesktop', {
      main: 'ratings',
      //left: 'luxMenu'
    });
  }
})

FlowRouter.route('/theme', { 
  name: 'theme',
  action() {
    BlazeLayout.render('luxDesktop', {
      main: 'theme',
      //left: 'luxMenu'
    });
  }
})

FlowRouter.route('/decentralization', {
  name: 'decentralization',
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'decentralization',
      //left: 'sideNav'
    })
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
    BlazeLayout.render('desktop', {
      main: 'addHashpower',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/flagged-hashpower', {
  name: 'flagged-hashpower',
  subscriptions: function () {
    this.register('flaggedhashpower', SubsCache.subscribe('flaggedhashpower'));
    this.register('hashhardware', SubsCache.subscribe('hashhardware'));
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'));
    this.register('hashunits', SubsCache.subscribe('hashunits'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'flaggedHashpower',
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
    BlazeLayout.render('desktop', {
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
    BlazeLayout.render('desktop', {
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
    BlazeLayout.render('desktop', {
      main: 'communities',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/flagged-users', {
  name: 'flaggedUsers',
  subscriptions: function () {
    this.register('userData', SubsCache.subscribe('userData'));
    this.register('users', SubsCache.subscribe('users'));
  },
  action: function () {
    if (Meteor.userId()) {
      BlazeLayout.render('desktop', {
        main: 'flaggedUsers',
        //left: 'sideNav'
      })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
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
    BlazeLayout.render('desktop', {
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
    BlazeLayout.render('desktop', {
      main: 'developers',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/profile', {
  name: 'profile',
  subscriptions: function () {
    
 },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'editProfile',
      //left: 'sideNav'
    })
  }
})

FlowRouter.route('/questions', {
  name: 'questions',
  subscriptions: function () {
    this.register('ratings_templates', SubsCache.subscribe('ratings_templates'));
  },
  action() {
    BlazeLayout.render('desktop', {
      main: 'questions',
      //left: 'sideNav'
    });
    //  if(Meteor.isServer) {    }
  }
});

FlowRouter.route('/bounties', {
  name: 'bounties',
  subscriptions: function () {
    this.register('bounties', SubsCache.subscribe('bounties'));
    this.register('bountytypes', SubsCache.subscribe('bountytypes'));
  },
  action() {
    BlazeLayout.render('desktop', {
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
    BlazeLayout.render('desktop', {
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
    // this.register('formdata', SubsCache.subscribe('formdata')); //userId isn't
    // availabe on server
  },
  action: function () {
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
    BlazeLayout.render('luxDesktop', {
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
    BlazeLayout.render('editAnything', {main: 'userPendingCurrencies'});
  }
});

FlowRouter.route('/changedcurrencies', {
  subscriptions: function () {
    this.register('changedCurrencies', SubsCache.subscribe('changedCurrencies'))
    this.register('hashalgorithm', SubsCache.subscribe('hashalgorithm'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('luxDesktop', {
      main: 'changedCurrencies',
      //left: 'luxMenu'
    });
  }
});

FlowRouter.route('/moderator', {
  subscriptions: function () {
    this.register('pendingcurrencies', SubsCache.subscribe('pendingcurrencies'));
    this.register('bounties', SubsCache.subscribe('bounties'));
    this.register('walletimages', SubsCache.subscribe('walletimages'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'moderatorDash'});
  }
});

FlowRouter.route('/notifications', {
  subscriptions: function () {
    this.register('activitylog', SubsCache.subscribe('activitylog'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'activityLog'});
  }
});

FlowRouter.route('/wallet', {
  subscriptions: function () {
    this.register('wallet', SubsCache.subscribe('wallet'));
    this.register("publicUserData", SubsCache.subscribe("publicUserData"))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'wallet'});
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

import {FlowRouter} from 'meteor/staringatlights:flow-router';
import {FastRender} from 'meteor/staringatlights:fast-render'

if (Meteor.isClient) { // only import them if this code is being executed on client side
  import '../../ui/layouts/MainBody.html'
  import '../../ui/pages/currencyEdit/currencyEdit.js'
  import '../../ui/pages/changedCurrencies/changedCurrencies.js'
  import '../../ui/pages/hashpower/addHashpower'
  import '../../ui/pages/hashpower/allHashpower'
  import '../../ui/pages/hashpower/allHashaverage'
  import '../../ui/pages/flaggedUsers/flaggedUsers'
  import '../../ui/pages/hashpower/flaggedHashpower'
  import '../../ui/pages/compareCurrencies/compareCurrencies'
  import '../../ui/pages/userProfile/userProfile'
}

//global subscriptions (on client side immidiately available)
FlowRouter.subscriptions = function() {
  this.register('publicUserData', Meteor.subscribe('publicUserData'));
};

FlowRouter.route('/currencyEdit/:slug?/:field?', {
  subscriptions: function (params) {
    this.register('approvedcurrency', Meteor.subscribe('approvedcurrency', params.slug));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('desktop', {
      main: 'currencyEdit',
      left: 'menu'
    });
  }
})

FlowRouter.route('/profile/:slug', {
  subscriptions: function (params) {
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'))
    this.register('userdataSlug', Meteor.subscribe('userdataSlug', params.slug))
    this.register('user', Meteor.subscribe('user', params.slug))
    this.register('comments', Meteor.subscribe('comments'))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('desktop', {
      main: 'userProfile',
      left: 'menu'
    })
  }
})

FlowRouter.route('/compareCurrencies', {
  name: 'compare-currencies',
  subscriptions: function (params) {
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'))
    this.register('graphdata', Meteor.subscribe('graphdata'))
    this.register('features', Meteor.subscribe('features'))
    this.register('redflags', Meteor.subscribe('redflags'))
  },
  action: (params, queryParams) => {
    BlazeLayout.render('desktop', {
      main: 'compareCurrencies',
      left: 'menu'
    })
  }
})

FlowRouter.route('/', {
  name: 'BLOCKRAZOR',
  subscriptions: function () {
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'));
  },
  action() {
    BlazeLayout.render('desktop', {
      main: 'returnedCurrencies',
      left: 'menu'
    });
  }
})

FlowRouter.route('/ratings', {
  name: 'ratings',
  subscriptions: function () {
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'));
    this.register('ratings', Meteor.subscribe('ratings'));
    this.register('walletBounty', Meteor.subscribe('walletBounty'));
    this.register('walletimages', Meteor.subscribe('walletimages'));
  },
  action() {
    BlazeLayout.render('luxDesktop', {
      main: 'ratings',
      left: 'luxMenu'
    });
  }
})

FlowRouter.route('/theme', {
  name: 'theme',
  action() {
    BlazeLayout.render('luxDesktop', {
      main: 'theme',
      left: 'luxMenu'
    });
  }
})

FlowRouter.route('/decentralization', {
  name: 'decentralization',
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'decentralization',
      left: 'menu'
    })
  }
})

FlowRouter.route('/add-hashpower', {
  name: 'add-haspower',
  subscriptions: function () {
    this.register('formdata', Meteor.subscribe('formdata'));
    this.register('hashhardware', Meteor.subscribe('hashhardware'));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
    this.register('hashunits', Meteor.subscribe('hashunits'));
    this.register('hashpowerBounty', Meteor.subscribe('hashpowerBounty'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'addHashpower',
      left: 'menu'
    })
  }
})

FlowRouter.route('/flagged-hashpower', {
  name: 'flagged-hashpower',
  subscriptions: function () {
    this.register('flaggedhashpower', Meteor.subscribe('flaggedhashpower'));
    this.register('hashhardware', Meteor.subscribe('hashhardware'));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
    this.register('hashunits', Meteor.subscribe('hashunits'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'flaggedHashpower',
      left: 'menu'
    })
  }
})

FlowRouter.route('/avg-hashpower', {
  name: 'avg-haspower',
  subscriptions: function () {
    this.register('hashaverage', Meteor.subscribe('hashaverage'));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'allHashaverage',
      left: 'menu'
    })
  }
})

FlowRouter.route('/hashpower', {
  name: 'haspower',
  subscriptions: function () {
    this.register('hashpower', Meteor.subscribe('hashpower'));
    this.register('hashhardware', Meteor.subscribe('hashhardware'));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
    this.register('hashunits', Meteor.subscribe('hashunits'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'allHashpower',
      left: 'menu'
    })
  }
})

FlowRouter.route('/communities', {
  name: 'communities',
  subscriptions: function () {
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'));
    this.register('ratings', Meteor.subscribe('ratings'));
    this.register('communityBounty', Meteor.subscribe('communityBounty'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'communities',
      left: 'menu'
    })
  }
})

FlowRouter.route('/flagged-users', {
  name: 'flaggedUsers',
  subscriptions: function () {
    this.register('userData', Meteor.subscribe('userData'));
    this.register('users', Meteor.subscribe('users'));
  },
  action: function () {
    if (Meteor.userId()) {
      BlazeLayout.render('desktop', {
        main: 'flaggedUsers',
        left: 'menu'
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
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'));
    this.register('ratings', Meteor.subscribe('ratings'));
    this.register('codebaseBounty', Meteor.subscribe('codebaseBounty'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'codebase',
      left: 'menu'
    })
  }
})

FlowRouter.route('/developers', {
  name: 'developers',
  subscriptions: function () {
    this.register('developers', Meteor.subscribe('developers'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'developers',
      left: 'menu'
    })
  }
})

FlowRouter.route('/profile', {
  name: 'profile',
  subscriptions: function () {
    this.register('_extendUser', Meteor.subscribe('_extendUser'));
  },
  action: () => {
    BlazeLayout.render('desktop', {
      main: 'viewprofile',
      left: 'menu'
    })
  }
})

FlowRouter.route('/questions', {
  name: 'questions',
  subscriptions: function () {
    this.register('ratings_templates', Meteor.subscribe('ratings_templates'));
  },
  action() {
    BlazeLayout.render('desktop', {
      main: 'questions',
      left: 'menu'
    });
    //  if(Meteor.isServer) {    }
  }
});

FlowRouter.route('/bounties', {
  name: 'bounties',
  subscriptions: function () {
    this.register('bounties', Meteor.subscribe('bounties'));
    this.register('bountytypes', Meteor.subscribe('bountytypes'));
  },
  action() {
    BlazeLayout.render('desktop', {
      main: 'bounties',
      left: 'menu'
    });
    //  if(Meteor.isServer) {    }
  }
});

FlowRouter.route('/bounties/:_id', {
  name: 'CurrencyDetail',
  subscriptions: function (params) {
    this.register('bounties', Meteor.subscribe('bounties', params._id));
  },
  action: function (params, queryParams) {
    console.log("rendering activeBounty");
    BlazeLayout.render('desktop', {
      main: 'activeBounty',
      left: 'menu'
    });
    console.log("finished rendering activeBounty");
  }
});

FlowRouter.route('/addcoin', {
  name: 'addcoin',
  subscriptions: function () {
    this.register('currencyBounty', Meteor.subscribe('currencyBounty'));
    this.register('addCoinQuestions', Meteor.subscribe('addCoinQuestions'));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
    // this.register('formdata', Meteor.subscribe('formdata')); //userId isn't
    // availabe on server
  },
  action: function () {
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
      BlazeLayout.render('editAnything', {main: 'addCoin'});
      this.register('formdata', Meteor.subscribe('formdata'));

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
    this.register('approvedcurrency', Meteor.subscribe('approvedcurrency', param.slug));
    this.register('hashalgorithm', Meteor.subscribe('hashalgorithm'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('desktop', {
      main: 'currencyDetail',
      left: 'menu',
      bottom: 'edit'
    });
  }
});

FlowRouter.route('/mypending', {
  subscriptions: function () {
    this.register('bounties', Meteor.subscribe('bounties'));
    this.register('pendingcurrencies', Meteor.subscribe('pendingcurrencies'));
    this.register('rejectedcurrencies', Meteor.subscribe('rejectedcurrencies'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'userPendingCurrencies'});
  }
});

FlowRouter.route('/changedcurrencies', {
  subscriptions: function () {
    this.register('changedCurrencies', Meteor.subscribe('changedCurrencies'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('desktop', {
      main: 'changedCurrencies',
      left: 'menu'
    });
  }
});

FlowRouter.route('/moderator', {
  subscriptions: function () {
    this.register('pendingcurrencies', Meteor.subscribe('pendingcurrencies'));
    this.register('bounties', Meteor.subscribe('bounties'));
    this.register('walletimages', Meteor.subscribe('walletimages'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'moderatorDash'});
  }
});

FlowRouter.route('/notifications', {
  subscriptions: function () {
    this.register('activitylog', Meteor.subscribe('activitylog'));
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'activityLog'});
  }
});

FlowRouter.route('/wallet', {
  subscriptions: function () {
    this.register('wallet', Meteor.subscribe('wallet'));
    this.register("publicUserData", Meteor.subscribe("publicUserData"))
  },
  action: function (params, queryParams) {
    BlazeLayout.render('editAnything', {main: 'wallet'});
  }
});

FlowRouter.route('/m', {
  name: 'mobile',
  subscriptions: function () {
    this.register('approvedcurrencies', Meteor.subscribe('approvedcurrencies'));
  },
  action() {
    BlazeLayout.render('mobile', {
      main: 'returnedCurrencies',
      top: 'menu'
    });
    console.log("Rendered mobile");
  }
});

FlowRouter.route('/login', {
  name: 'login',
  action: () => {
    if (!Meteor.userId()) {
      BlazeLayout.render('login')
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

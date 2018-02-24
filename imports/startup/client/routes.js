import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

//import layouts
import '../../ui/layouts/MainBody.html'
import '../../ui/pages/currencyEdit/currencyEdit.js'
import '../../ui/pages/changedCurrencies/changedCurrencies.js'
import '../../ui/pages/hashpower/addHashpower'
import '../../ui/pages/hashpower/allHashpower'
import '../../ui/pages/hashpower/allHashaverage'
import '../../ui/pages/flaggedUsers/flaggedUsers'

FlowRouter.route( '/currencyEdit/:slug?/:field?', {
  action: function( params, queryParams ) {
    
    BlazeLayout.render('desktop', { main: 'currencyEdit', left: 'menu'});
  }
});


FlowRouter.route('/', {
  name: 'BLOCKRAZOR',
  // subscriptions: function() {
  //   this.register('currencies', Meteor.subscribe('currencies'));
  // },
  action() {
    BlazeLayout.render('desktop', { main: 'returnedCurrencies', left: 'menu'});
  },
})

FlowRouter.route('/ratings', {
  name: 'ratings',
  // subscriptions: function() {
  //   this.register('currencies', Meteor.subscribe('currencies'));
  // },
  action() {
    BlazeLayout.render('desktop', { main: 'ratings', left: 'menu'});
  //  if(Meteor.isServer) {

//    }
  },
})

FlowRouter.route('/decentralization', {
  name: 'decentralization',
  action: () => {
    BlazeLayout.render('desktop', { main: 'decentralization', left: 'menu'})
  }
})

FlowRouter.route('/add-hashpower', {
  name: 'add-haspower',
  action: () => {
    BlazeLayout.render('desktop', { main: 'addHashpower', left: 'menu'})
  }
})

FlowRouter.route('/avg-hashpower', {
  name: 'avg-haspower',
  action: () => {
    BlazeLayout.render('desktop', { main: 'allHashaverage', left: 'menu'})
  }
})

FlowRouter.route('/hashpower', {
  name: 'haspower',
  action: () => {
    BlazeLayout.render('desktop', { main: 'allHashpower', left: 'menu'})
  }
})

FlowRouter.route('/communities', {
  name: 'communities',
  action: () => {
    BlazeLayout.render('desktop', { main: 'communities', left: 'menu'})
  }
})

FlowRouter.route('/flagged-users', {
  name: 'flaggedUsers',
  action: function() {
    if (Meteor.userId()) {
      BlazeLayout.render('desktop', { main: 'flaggedUsers', left: 'menu' })
    } else {
      window.last = window.location.pathname
      FlowRouter.go('/login')
    }
  }
})

FlowRouter.route('/codebase', {
  name: 'codebase',
  action: () => {
    BlazeLayout.render('desktop', { main: 'codebase', left: 'menu'})
  }
})

FlowRouter.route('/developers', {
  name: 'developers',
  action: () => {
    BlazeLayout.render('desktop', { main: 'developers', left: 'menu'})
  }
})

FlowRouter.route('/profile', {
  name: 'profile',
  action: () => {
    BlazeLayout.render('desktop', { main: 'viewprofile', left: 'menu'})
  }
})

FlowRouter.route('/questions', {
  name: 'questions',
  // subscriptions: function() {
  //   this.register('currencies', Meteor.subscribe('currencies'));
  // },
  action() {
    BlazeLayout.render('desktop', { main: 'questions', left: 'menu'});
  //  if(Meteor.isServer) {

//    }
  },
});

FlowRouter.route('/bounties', {
  name: 'bounties',
  // subscriptions: function() {
  //   this.register('currencies', Meteor.subscribe('currencies'));
  // },
  action() {
    BlazeLayout.render('desktop', { main: 'bounties', left: 'menu'});
  //  if(Meteor.isServer) {

//    }
  },
});

FlowRouter.route( '/bounties/:_id', {
  name: 'CurrencyDetail',
  action: function( params, queryParams ) {
    console.log("rendering activeBounty");
    BlazeLayout.render('desktop', { main: 'activeBounty', left: 'menu'});
    console.log("finished rendering activeBounty");
  }
});

FlowRouter.route('/addcoin', {
  name: 'addcoin',
  action: function() {
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
      BlazeLayout.render('editAnything', { main: 'addCoin'});
      this.register('formdata', Meteor.subscribe('formdata'));

    } else {
      // but if the user is not logged in, you have to redirect him to the login page
      // if we want to be able to redirect the user back to where he was, we have to save the current path 
      window.last = window.location.pathname
      // and go to the login page
      FlowRouter.go('/login')
    }
  }
})

FlowRouter.route( '/currency/:slug', {
  name: 'CurrencyDetail',
  action: function( params, queryParams ) {
    BlazeLayout.render('desktop', { main: 'currencyDetail', left: 'menu', bottom: 'edit'});
  }
});



FlowRouter.route( '/mypending', {
  action: function( params, queryParams ) {
    BlazeLayout.render('editAnything', { main: 'userPendingCurrencies'});
  }
});

FlowRouter.route( '/changedcurrencies', {
  action: function( params, queryParams ) {
    BlazeLayout.render('desktop', { main: 'changedCurrencies', left: 'menu'});
  }
});

FlowRouter.route( '/moderator', {
  action: function( params, queryParams ) {
    BlazeLayout.render('editAnything', { main: 'moderatorDash'});
  }
});

FlowRouter.route( '/notifications', {
  action: function( params, queryParams ) {
    BlazeLayout.render('editAnything', { main: 'activityLog'});
  }
});

FlowRouter.route( '/wallet', {
  action: function( params, queryParams ) {
    BlazeLayout.render('editAnything', { main: 'wallet'});
  }
});

FlowRouter.route('/m', {
  name: 'mobile',
  action() {
    BlazeLayout.render('mobile', { main: 'returnedCurrencies', top: 'menu'});
    console.log("Rendered mobile");
  },
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
    BlazeLayout.render('error', { main: 'App_notFound' });
  },
};

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
  name: 'BLOCKRAZOR',
  // subscriptions: function() {
  //   this.register('currencies', Meteor.subscribe('currencies'));
  // },
  action() {
    BlazeLayout.render('desktop', { main: 'returnedCurrencies', left: 'menu'});
  },
});

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

FlowRouter.route('/communities', {
  name: 'communities',
  action: () => {
    BlazeLayout.render('desktop', { main: 'communities', left: 'menu'})
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
    // first check if the user is logged in
    if (Meteor.userId()) {
      // if the user is logged in, you can render the intented page
      BlazeLayout.render('editAnything', { main: 'addCoin'});
      this.register('formdata', Meteor.subscribe('formdata'));
      console.log("Rendered addCoin")
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

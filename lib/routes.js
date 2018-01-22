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
});

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
  action() {
    BlazeLayout.render('editAnything', { main: 'addCoin'});
    this.register('formdata', Meteor.subscribe('formdata'));
    console.log("Rendered addCoin");
  },
});

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

// the App_notFound template is used for unknown routes and missing lists
FlowRouter.notFound = {
  action() {
    BlazeLayout.render('error', { main: 'App_notFound' });
  },
};

import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

FlowRouter.route('/', {
  name: 'desktop',
  // subscriptions: function() {
  //   this.register('currencies', Meteor.subscribe('currencies'));
  // },
  action() {
    BlazeLayout.render('desktop', { main: 'returnedCurrencies', left: 'menu'});
    console.log("Rendered returnedCurrencies");
  },
});

FlowRouter.route('/addcoin', {
  name: 'addcoin',
  action() {
    BlazeLayout.render('editAnything', { main: 'addCoin'});
    this.register('formdata', Meteor.subscribe('formdata'));
    console.log("Rendered addCoin");
  },
});

FlowRouter.route( '/currency/:_id', {
  action: function( params, queryParams ) {
    BlazeLayout.render('desktop', { main: 'returnedCurrencies', left: 'menu', bottom: 'edit'});
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
    BlazeLayout.render('App_body', { main: 'App_notFound' });
  },
};

import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/staringatlights:flow-router';;
import Cookies from 'js-cookie';

import './activeBounty.html'


Template.activeBounty.onCreated(function() {
  this.now = new ReactiveVar(Date.now())
})

Template.activeBounty.onRendered(function(){
  Session.set(Cookies.get('bountyType'))
  Meteor.setInterval(() => {
      this.now.set(Date.now())
  }, 1000);
  Meteor.setInterval(function() {
      if(Date.now() >= Cookies.get('expiresAt')) {
        FlowRouter.go("/bounties");
      }
  }, 1000);
});

Template.activeBounty.onCreated(function(){
  this.autorun(() => {
    SubsCache.subscribe('bounties', FlowRouter.getParam("_id"));
  });
});//Session.set('activeBountyRendered', true);

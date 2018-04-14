import { Mongo } from 'meteor/mongo';
import Analytics from 'analytics-node'
var analytics = new Analytics('auAfRv1y0adOiVyz1TZB9nl18LI9UT98');

//function to send user events to segment, a payload is required to send to segment per the below analytics.track function
export var segmentEvent = function(payload) {
    if (payload) {
        console.log(payload)
        analytics.track({
            userId: Meteor.userId(),
            event: payload.event,
            properties: payload.properties
        });
    } else {
        throw new Meteor.Error('Not event payload has been provided')
    }
};
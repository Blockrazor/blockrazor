import { Template } from 'meteor/templating'

import './discussion.html'

Template.discussion.helpers({
  totalComments: function () {
    return 123;
  },
  topComment: function() {
    return [{
      _id: "3456435",
      commentText: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies.",
      currencyId: "56735836736",
      authorName: "bitcoinfan",
      authorId: "985273948"
    }];

  },
  topReply: function() {
    return [{
      _id: "83958374",
      parentId: "3456435",
      commentText: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient.",
       authorName: "dashfan",
       authorId: "2345354"
    }]
  }
});

Template.questions.events({
  'submit form': function(event) {
    event.preventDefault();
    var catagory = "wallet";
    Meteor.call('addRatingQuestion', event.target.question.value, catagory);
    $('#question').val('');
  }
});

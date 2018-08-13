import './landingpage.html'



Template.landingpage.onRendered(function() {
    //hide the menu when the landing page is open
    $('body').removeClass("sidebar-md-show")
});
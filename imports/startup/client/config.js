// ***************************************************************
// Config for client-side only
// ***************************************************************

// Theme configurations
// Append required theme's classes to the document body
$('body').addClass('app header-fixed sidebar-fixed aside-menu-fixed sidebar-md-show');
// listener to listen for window resize events, in order to display/hide navbar
$(window).resize(function(evt) {
    $('body').removeClass("sidebar-lg-show sidebar-md-show")
    if ($(window).width() >= 768) {
        $('body').addClass("sidebar-md-show")
    }
});

if ($(window).width() <= 768) {
    $('body,html').click(function(event) {
        event.preventDefault()

        if ($('body').hasClass('sidebar-lg-show')) {
            $('body').toggleClass("sidebar-lg-show")
        }
    });
}
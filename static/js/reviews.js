(function () {

    $('.cover').on('mouseenter', function ($event) {
        $('.desc .title').text($event.target.dataset.title);
    });

    $('.cover').on('mouseleave', function () {
        $('.desc .title').text('');
    });

    $('.cover').on('click', function ($event) {
        $($event.target).addClass('selected');
        $('body').addClass('view');
        $('.meta .title').text($event.target.dataset.title);
    });

    $('.arrow').on('click', function () {
        $('.cover').removeClass('selected');
        $('body').removeClass('view');
    });

})();
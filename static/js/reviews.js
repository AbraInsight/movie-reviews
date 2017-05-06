(function () {

    var current_data = [];
    var current_film = [];
    var current_period = 1;
    var structure = ['dt', 'summed', 'num'];

    $('.cover').on('mouseenter', function ($event) {
        $('.desc .title').text($event.target.dataset.title);
    });

    $('.cover').on('mouseleave', function () {
        $('.desc .title').text('');
    });

    $('.cover').on('click', function ($event) {
        current_film = $event.target.dataset.id;
        $($event.target).addClass('selected');
        $('body').addClass('view');
        $('.meta .title').text($event.target.dataset.title);
        drawAll();
    })

    $('.arrow').on('click', function () {
        $('.cover').removeClass('selected');
        $('body').removeClass('view');
        current_film = '';
    });

    // call the google charts api loader and callback on ready
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(getData);

    function getData() {
        // call the server for data
        $.get('/api/realtime/init/?period=' + encodeURIComponent(current_period))
            .done(function (resp) {
                current_data = resp;
            });
    }

    var socket = io('http://127.0.0.1:4200/api/realtime/update');
    socket.on('connect', function () {
        console.log('CONNECT');
    });
    socket.on('message', function (snap) {
        if (current_data[snap.film].length > (current_period * 60)) {
            current_data[snap.film].splice(0, 1);
        }
        current_data[snap.film].push(snap.data);
        if (current_film !== '') {
            drawAll();
        }
    });

    function buildData(config) {
        var out = [];
        var line = [];
        // line.push(moment.unix(item.timestamp).format("HH:mm") + ':00');
        line.push(moment.unix(current_data[config[0]]).format("HH:mm:ss"));
        config.forEach(function (col) {
            line.push(col);
        });
        out.push(line);
        return out;
    }

    function drawAll() {
        console.log(current_film);
        console.log(current_data[current_film]);

        // data = [];
        // row = [];

        var build1 = new google.visualization.DataTable();
        build1.addColumn('string', 'Time');
        build1.addColumn('number', 'Number of Tweets');

        var build2 = new google.visualization.DataTable();
        build2.addColumn('string', 'Time');
        build2.addColumn('number', 'Total Sentiment');

        build1.addRows(buildData(['dt', 'summed']));
        build2.addRows(buildData(['dt', 'num']));

        var chart = new google.visualization.LineChart(document.getElementById('num'));
        chart.draw(build1);

        var chart = new google.visualization.LineChart(document.getElementById('sum'));
        chart.draw(build2);
    };

})();
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
        current_data[current_film].forEach(function (row) {
            line = [];
            config.forEach(function (col) {
                var i = structure.indexOf(col);
                if (col == 'dt') {
                    line.push(moment.unix(row[i]).format("HH:mm") + ':00');
                } else {
                    line.push(row[i]);
                }
            })
            out.push(line);
        });
        console.log(out);
        return out;
    }
    
    $(window).on('resize', drawAll);

    function drawAll() {
        var build1 = new google.visualization.DataTable();
        build1.addColumn('string', 'Time');
        build1.addColumn('number', 'Number of Tweets');

        var build2 = new google.visualization.DataTable();
        build2.addColumn('string', 'Time');
        build2.addColumn('number', 'Total Sentiment');

        build1.addRows(buildData(['dt', 'num']));
        build2.addRows(buildData(['dt', 'summed']));

                var options = {
            // colors: config.colors,
            // hAxis: {
            //     slantedText: true,
            //     showTextEvery: getTickInterval()
            // },
            chartArea: {
                top: 30,
                bottom: 80,
                left: 70,
                right: 40,
                width: '100%',
                height: '100%'
            },
            theme: {
                legend: {
                    position: 'none'
                }
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById('num'));
        chart.draw(build1, options);

        var chart = new google.visualization.LineChart(document.getElementById('sum'));
        chart.draw(build2, options);
    };

})();
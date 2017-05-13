(function () {

    var data;
    var film;
    var period = 1;
    var structure = ['dt', 'summed', 'num'];

    $('.cover').on('mouseenter', function ($event) {
        $('.desc .title').text($event.target.dataset.title);
    });

    $('.cover').on('mouseleave', function () {
        $('.desc .title').text('');
    });

    $('.cover').on('click', function ($event) {
        film = $event.target.dataset.id;
        $($event.target).addClass('selected');
        $('body').addClass('view');
        $('.meta .title').text($event.target.dataset.title);
        if (data) {
            drawAll();
        }
    })

    $('.arrow').on('click', function () {
        $('.cover').removeClass('selected');
        $('body').removeClass('view');
        film = '';
    });

    $('#picker').on('change', function ($event) {
        period = $event.target.value;
        $('body').removeClass('ready');
        getData(true)
            .then(function () {
                if (data) {
                    drawAll();
                }
            });
    });

    $(window).on('resize', function () {
        if (data && film) {
            drawAll();
        }
    });

    // call the google charts api loader and callback on ready
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(getData);

    var socket = io('http://104.199.106.153:4200/api/realtime/update');
    socket.on('connect', function () {
        console.log('CONNECT');
    });

    function getData(update) {
        loading = true;
        // call the server for data
        return $.get('/api/realtime/init/?period=' + encodeURIComponent(period))
            .done(function (resp) {
                $('body').addClass('ready');
                data = resp;
                if (!update) {
                    setupSockets();
                }
                if (film) {
                    drawAll();
                }
            });
    }

    function setupSockets() {
        socket.on('message', function (snap) {
            if (data[snap.film].length > (period * 60)) {
                data[snap.film].splice(0, 1);
            }
            data[snap.film].push(snap.data);
            if (film) {
                drawAll();
            }
        });
    }

    function buildData(config) {
        var out = [];
        data[film].forEach(function (row) {
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
        return out;
    }

    function drawAll() {
        draw('num');
        draw('summed');
    }

    function draw(id) {
        var build = new google.visualization.DataTable();
        build.addColumn('string', 'Time');
        if (id == 'num') {
            build.addColumn('number', 'Number of Tweets');
        }
        if (id == 'summed') {
            build.addColumn('number', 'Total Sentiment');
        }
        build.addRows(buildData(['dt', id]));

        var options = {
            colors: id == 'summed' ? ['rgb(220,100,50)'] : null,
            hAxis: {
                slantedText: true,
                // showTextEvery: getTickInterval()
                textStyle: { color: 'rgb(150,150,150)' }
            },
            vAxis: {
                textStyle: { color: 'rgb(150,150,150)' },
                gridlines: {
                    color: "rgb(100,100,100)"
                },
                baselineColor: 'rgb(150,150,150)'
            },
            chartArea: {
                top: 30,
                bottom: 80,
                left: 70,
                right: 40,
                width: '100%',
                height: '100%',
                backgroundColor: {
                    fill: 'rgb(55,55,55)'
                }
            },
            backgroundColor: 'transparent',
            theme: {
                legend: {
                    position: 'none'
                }
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById(id));
        chart.draw(build, options);
    };

})();
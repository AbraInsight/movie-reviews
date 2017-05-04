(function () {
    var structure = ['dt', 'summed', 'num'];
    var current_period = 1;
    var current_data = [];
    var graphs = [{
        id: 'macbeth1',
        columns: ['summed'],
        table: 'lady_macbeth',
    }, {
        id: 'dog1',
        columns: ['summed'],
        table: 'dogs_purpose',
    }, {
        id: 'arthur1',
        columns: ['summed'],
        table: 'king_arthur',
    }, {
        id: 'logan1',
        columns: ['summed'],
        table: 'logan',
    }, {
        id: 'macbeth2',
        columns: ['num'],
        table: 'lady_macbeth',
    }, {
        id: 'dog2',
        columns: ['num'],
        table: 'dogs_purpose',
    }, {
        id: 'arthur2',
        columns: ['num'],
        table: 'king_arthur',
    }, {
        id: 'logan2',
        columns: ['num'],
        table: 'logan',
    }]

    // call the google charts api loader and callback on ready
    google.charts.load('current', { 'packages': ['corechart'] });
    google.charts.setOnLoadCallback(getData);

    // setup change event on the date select
    $('#period_picker').on('change', function (e) {
        period = e.target.value;
        if (current_period !== period) {
            current_period = parseInt(period);
            getData();
        }
    });

    $(window).on('resize', drawAll);

    function drawAll() {
        graphs.forEach(function (config) {
            draw(config);
        });
    }

    /**
     * Get a new set of data from the server
     */
    function getData(period) {
        // on init we won't have a date so get it manually from the date select
        if (!period) {
            period = $('#period_picker').val();
        }

        // call the server for data
        $.get('/api/realtime/init/?period=' + encodeURIComponent(period))
            .done(function (resp) {
                current_data = resp;
                drawAll();
            });
    }


    function getTickInterval() {
        switch (current_period) {
            case 1:
                return 5
                break;
            case 12:
                return 60
                break;
            case 72:
                return 180
                break;
        }
    }

    /**
     * Extract only the data we want to display on the graph from the full data set
     */
    function buildData(config) {
        var out = [];
        current_data[config.table].forEach(function (item) {
            var line = [];
            // line.push(moment.unix(item.timestamp).format("HH:mm") + ':00');
            line.push(moment.unix(item[0]).format("HH:mm:ss"));
            config.columns.forEach(function (col) {
                line.push(item[structure.indexOf(col)]);
            });
            out.push(line);
        });
        return out;
    }

    function getDesc(col) {
        switch (col) {
            case 'dt':
                return 'Date';
                break;
            case 'film':
                return 'Film'
                break;
            case 'summed':
                return 'Total Sentiment'
                break;
            case 'num':
                return 'Number Of Tweets'
                break;
        }
    }

    function getColors(columns) {
        var colors = [];
        columns.forEach(function (column) {
            if (column == 'summed') {
                colors.push('#FF9800');
            } else {
                colors.push('#F44336');
            }
        });
        return colors;
    }

    /**
     * draw the graph
     */
    function draw(config) {
        var builder = new google.visualization.DataTable();
        builder.addColumn('string', 'Time');

        config.columns.forEach(function (col) {
            builder.addColumn('number', getDesc(col));
        });

        builder.addRows(buildData(config));

        var options = {
            colors: getColors(config.columns),
            legend: { position: 'none' },
            hAxis: {
                slantedText: true,
                showTextEvery: getTickInterval()
            },
            chartArea: {
                top: 30,
                bottom: 30,
                left: 70,
                right: 40,
                width: '100%',
                height: '100%'
            }
        };

        var chart = new google.visualization.LineChart(document.getElementById(config.id));

        chart.draw(builder, options);
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
        drawAll();
    });
})();
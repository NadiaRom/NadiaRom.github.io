d3.tsv('timeline.tsv', function (error, data) {
    if (error) { throw error; }
    // data.forEach(function (d) {
    //     d.max_freq = +d.max_freq;
    //     d.month = d3.timeParse(d.month, '%Y-%m-%d');
    // });

    var parseDate = d3.timeParse('%Y-%m-%d');

    var monthly = d3.nest()
        .key(function(d) { return d.month; })
        .entries(data);

    var timeScale = d3.scaleTime()
        .domain([parseDate('2013-08-19'), parseDate('2017-10-21')])
        .range([50, 600]);

    var rectWidth = 8;

    var pointScale = d3.scaleLinear()
        .domain([0, 40])
        .rangeRound([600, 100]);

    var rScale = d3.scaleLinear()
        .domain([1, 21])
        .range([2, rectWidth])
        .clamp(true);

    var gMonth = d3.select('svg')
        .selectAll('g')
        .data(monthly)
        .enter()
        .append('g')
        .attr('class', 'month')
        .attr('id', function (d) {  return d.key;  })
        .attr('transform', function (d) {
            return 'translate(' + timeScale(parseDate(d.key)) + ', 0)';
        });

    var dots = gMonth.selectAll('rect')
        .data(function (dat) {  return dat.values;  })
        .enter()
        .append('rect')
        .attr('id', function (d) {  return 'rid' + d.right_id  })
        .attr('x', 0)
        .attr('y', function (d, i) {  return pointScale(i) - rScale(+d.max_freq);  })
        .attr('width', function (d) {  return rScale(+d.max_freq);  })
        .attr('height', function (d) {  return rScale(+d.max_freq);  })
        .attr('class', function (d) {  return d.icao_airline;  })
        .attr('title', function (d) {
            var date = d.month.split('-');
            return '<p>від ' + date[1] + '/' + date[0] + '</p>' +
                '<p>d.airline_name</p>' +
                '<p>' + d.max_freq + 'р/т</p>' +
                '<p>' + d.from_city + '–' + d.to_city + '</p>';
        });

    var timeAxisM = d3.axisBottom(timeScale)
        .ticks(12, d3.timeMonth)
        .tickFormat(d3.timeFormat('%m'));

    var monthA = d3.select('svg')
        .append('g')
        .attr('id', 'month-axis')
        .attr('class', 'axis')
        .call(timeAxisM)
        .attr('transform', 'translate(-4 603)');

    monthA.selectAll('g.tick > line')
        .attr('y2', '3');

    var timeAxisY = d3.axisBottom(timeScale)
        .ticks(d3.timeYear)
        .tickFormat(d3.timeFormat('%Y'));

    var yearA = d3.select('svg')
        .append('g')
        .attr('id', 'year-axis')
        .attr('class', 'axis')
        .call(timeAxisY)
        .attr('transform', 'translate(0 623)');

    yearA.selectAll('g.tick > line, path.domain')
        .remove();

    var countAxis = d3.axisLeft(pointScale);

    var countA = d3.select('svg')
        .append('g')
        .attr('id', 'count-axis')
        .attr('class', 'axis')
        .call(countAxis)
        .attr('transform', 'translate(46 3)');

    countA.selectAll('g.tick > line')
        .attr('x2', '-3');

    // ---------- Annotate ---------------------------------------------------------------------------------------------

    // const annotations = [{
    //     note: { label: "Steve Jobs Returns" },
    //     subject: {
    //         y1: margin.top,
    //         y2: height - margin.bottom
    //     },
    //     y: margin.top,
    //     data: { x: "7/9/1997"} //position the x based on an x scale
    // }];


});






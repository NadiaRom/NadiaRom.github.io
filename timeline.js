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
        .range([0, 600]);

    var rectWidth = 7;

    var pointScale = d3.scaleLinear()
        .domain([0, 40])
        .rangeRound([450, 100]);

    var rScale = d3.scaleLinear()
        .domain([1, 21])
        .range([2, rectWidth])
        .clamp(true);

    var gMonth = d3.select('svg')
        .selectAll('g.month')
        .data(monthly)
        .enter()
        .append('g')
        .attr('class', 'month')
        .attr('id', function (d) {  return d.key;  })
        .attr('transform', function (d) {
            return 'translate(' + timeScale(parseDate(d.key)) + ', 0)';
        });

    // ---------- Annotate ---------------------------------------------------------------------------------------------

    const annotations = [
        {
            note: {
                title: 'Державіаслужба забирає в Мінінфраструктури право розподілу рейсів',
                label: 'Нові правила призначення на рейси заблокували в Мінюсті: обов\'язкові внутрішні рейси, міжнародні маршрути пропорційно до внутрішніх, лише українські власники компаній'
            },
            x: timeScale(parseDate('2014-10-24')),
            y: pointScale(0),
            dx: 0,
            dy: pointScale(40) - pointScale(30)
        },
        {
            note: {
                title: 'Робота комісії розблокована',
                label: 'Аудит Baker&McKenzie вирішив спір, хто має розподіляти рейси. ДАС відклала на рік скандальні норми',
                align: 'right'
            },
            x: timeScale(parseDate('2015-06-04')),
            y: pointScale(0),
            dx: 0,
            dy: pointScale(40) - pointScale(8)
        },
        {
            note: {
                title: 'Лобістські норми скасували',
                label: 'Державіаслужба внесла зміни до правил розподілу рейсів'
            },
            x: timeScale(parseDate('2016-04-04')),
            y: pointScale(0),
            dx: 0,
            dy: pointScale(40) - pointScale(20)
        }

    ];
    const annotation = d3.annotation()
        .type(d3.annotationLabel)
        .annotations(annotations);

    d3.select('svg')
        .append('g')
        .attr('class', 'annotation')
        .call(annotation);

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
        .attr('transform', 'translate(-4 453)');

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
        .attr('transform', 'translate(0 473)');

    yearA.selectAll('g.tick > line, path.domain')
        .remove();

    var countAxis = d3.axisLeft(pointScale);

    var countA = d3.select('svg')
        .append('g')
        .attr('id', 'count-axis')
        .attr('class', 'axis')
        .call(countAxis)
        .attr('transform', 'translate(-4 3)');

    countA.selectAll('g.tick > line')
        .attr('x2', '-3');

    d3.select('svg')
        .append('text')
        .attr('class', 'yaxis-title')
        .attr('y', pointScale(16))
        .attr('x', -45)
        .text('Кількість заявок')
        .attr('transform', 'rotate(-90, -45, ' + pointScale(16) + ')');

    var header = d3.select('svg')
        .append('g')
        .attr('id', 'header');

    var h1h2 = header.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .selectAll('tspan')
        .data([
            'Як Державіаслужба розподіляла міжнародні рейси',
            'Скільки заявок задовольнила комісія ДАС з 2014 по 2017 роки'
        ])
        .enter()
        .append('tspan')
        .attr('x', 0)
        .attr('y', 0)
        .style('alignment-baseline', 'hanging')
        .attr('dy', function (d, i) {  return i * 2 + 'rem'})
        .attr('id', function (d, i) {  return 'h' + (i + 1);  })
        .text(function (d) {  return d;  });

    var dCorner = 'm 239.41,248.309 c 0.36,0.351 0.59,1.679 0.59,1.679 l -240,0 L 0,9.98828 c 0,0 1.08984,0.90232 1.67969,1.44142 C 11.6406,138.621 113.441,240.301 239.41,248.309';

    header.append('g')
        .attr('id', 'corner')
        .attr('transform', 'rotate(90) matrix(0.16666667,0,0,0.16666686,-40,39.33411272)') //-0.66588728
        .append('path')
        .attr('d', dCorner)
        .attr('fill', '#f79c0f');

    d3.select('svg')
        .append('image')
        .attr('width', 100)
        .attr('y', 540)
        .attr('xlink:href', 'img/texty_timeline.png');

    d3.select('svg')
        .append('text')
        .attr('id', 'data-source')
        .selectAll('tspan')
        .data([
            'Дані: Державіаслужба,',
            'zakon.rada.gov.ua'
        ])
        .enter()
        .append('tspan')
        .attr('x', 492)
        .attr('y', 540)
        .attr('dy', function (d, i) {  return i * 2 + 'em';  })
        .text(function (d) {  return d;  });


    var legend = d3.select('svg')
        .append('g')
        .attr('id', 'legend')
        .attr('transform', 'translate(463, 100)');

    var legendItems = legend.selectAll('g.item')
        .data(['призначення МАУ', 'інші'])
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', function (d, i) {
            return i === 0 ? 'translate(0, 0)' : 'translate(0, 20)';
        });

    legendItems.append('rect')
        .attr('x', 0)
        .attr('y', rectWidth*0.5)
        .attr('width', rectWidth)
        .attr('height', rectWidth)
        .attr('class', function (d, i) {
            return i === 0 ? 'AUI' : 'other';
        });

    legendItems.append('text')
        .attr('x', rectWidth*1.7)
        .attr('y', 0)
        .text(function (d) {  return d;  });

});






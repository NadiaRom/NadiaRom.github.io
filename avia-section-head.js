// ---------- Heading and lead --------------------

d3.select('div#heading')
    .append('h1')
    .text('Зліт дозволено!');

d3.select('div#heading')
    .append('h2')
    .html('Українські авіакомпанії можуть літати в країни, з якими уряд уклав угоду про регулярне повітряне сполучення. ' +
        'Для компанія має отримати дозвіл від комісії Державіаслужби, в якому вказана максимальна частота рейсів за маршрутом.\n\n' +
        'Відкриті дані Державної авіаційної служби показують куди складно літати та які країни користуються попитом серед авіакомпаній.\n\n' +
        'Розклади рейсів проливають світло на те, як перевізники використовують права на регулярні рейси\n\n' +
        '<em><small>Куди летимо? Виберіть країну на карті, або почніть друкувати у вікні пошуку<small></em>')
    .style('white-space', 'pre-line');

// ---------- Map ---------------------------------
d3.json('country_treaties.geojson', function (error, geojson) {
    if (error) {  throw error;  }

    var map = L.map('map', {
        center: [50, 30],
        zoom: 3,
        scrollWheelZoom: false,
        fadeAnimation: false
    });


    map.createPane('labels');
    map.getPane('labels').style.zIndex = 450;
    map.getPane('labels').style.pointerEvents = 'none';

    // var tileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/nnnade4ka/cj7yos0wa62x72rqhdpx6crt0/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibm5uYWRlNGthIiwiYSI6ImNqMmIzNHUwajAwZ2YzM3M1dDg2NzF0OGIifQ.rKb2FgsvvDWoRv7Btz5jLQ',
    //     {
    //         attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    //         maxZoom: 18,
    //         pane: 'labels'
    //     });

    var CartoDB_PositronNoLabels = L.tileLayer.colorizr('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
        {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            maxZoom: 12,
            colorize: function (pixel) {
                return {  a: 190  };
            }
        });

    var CartoDB_PositronOnlyLabels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
        {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            maxZoom: 12,
            pane: 'labels'
        });

    function styleFunc(feature) {
        var fill = '';

        if (feature.properties.encountry == 'Ukraine') {
            fill = '#ca93fb';
        } else {
            switch (feature.properties.treaty_stage) {
                case 'проект':
                    fill = '#92bbb2';
                    break;
                case 'парафована':
                    fill = '#6ea49a';
                    break;
                case 'підписана':
                    fill = '#488f83';
                    break;
                case 'чинна':
                    fill = '#14796c';
            }
        }
        return {
            fillColor: fill,
            color: '#323335',
            weight: 0.5,
            fillOpacity: 0.7
        };
    }

    function moveToCountry() {
        // click to expand country card
        $('div#' + this.feature.properties.encountry)
            .find('.uncollapse-card a i')
            .click();

        d3.selectAll('div.country-profile-row:not(#' + this.feature.properties.encountry + ')')
            .classed('hidden-country', true);

        d3.select('div#' + this.feature.properties.encountry)
            .classed('hidden-country', false);

        $('body').scrollTo($('nav#table-header'), {
            duration: 1000
        });

        $('.typeahead').typeahead('val', '');
    }

    function onEachFeature(feature, layer) {
        layer.on({
            click: moveToCountry
        });
    }

    var jsonForeignLayer = L.geoJSON(geojson, {
        filter: function (feature) {  return feature.properties.encountry != 'Ukraine';  },
        style: styleFunc,
        onEachFeature: onEachFeature
    });

    jsonForeignLayer.bindTooltip(
        function (e) {
            return e.feature.properties.treaty_date == ''
                ? '<p class="tooltip-country">' + e.feature.properties.uacountry + '<br/>' +
                '<strong>Угода</strong>: ' + e.feature.properties.treaty_stage + '</p>'
                : '<p class="tooltip-country">' + e.feature.properties.uacountry + '<br/>' +
                '<strong>Угода</strong>: ' + e.feature.properties.treaty_stage + '<br/>' +
                'від ' + e.feature.properties.treaty_date + '</p>'
        },
        {
            sticky: true,
            className: 'map-tooltip tooltip-inner'
        }
    );

    var jsonUaLayer = L.geoJSON(geojson, {
        filter: function (feature) {  return feature.properties.encountry == 'Ukraine';  },
        style: styleFunc
    });

    jsonForeignLayer.addTo(map);
    jsonUaLayer.addTo(map);
    CartoDB_PositronOnlyLabels.addTo(map);
    CartoDB_PositronNoLabels.addTo(map);

});

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

    function styleFunc(feature) {
        var fill = '';

        if (feature.properties.encountry == 'Ukraine') {
            fill = '#bd7df9';
        } else {
            switch (feature.properties.treaty_stage) {
                case 'проект':
                    fill = '#9dcebc';
                    break;
                case 'парафована':
                    fill = '#5b9581';
                    break;
                case 'підписана':
                    fill = '#469e8d';
                    break;
                case 'чинна':
                    fill = '#14796c';
            }
        }

        return {
            fillColor: fill, color: '#323335', fillOpacity: 0.5, weight: 0.5
        };
    }

    mapmap = L.map('map-map', {
        center: [31, 47],
        zoom: 3,
        scrollWheelZoom: false
    });

    mapmap.createPane('labels');
    mapmap.getPane('labels').style.zIndex = 450;
    mapmap.getPane('labels').style.pointerEvents = 'none';

    var CartoDB_PositronNoLabels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    var CartoDB_PositronOnlyLabels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        pane: 'labels'
    });

    CartoDB_PositronOnlyLabels.addTo(mapmap);
    CartoDB_PositronNoLabels.addTo(mapmap);
    var geoFeatures = geojson.features.filter(function (d) {  return d.properties.uacountry;  });
    var jsonLayer = L.geoJSON(geoFeatures, {  style: styleFunc})
        .addTo(mapmap);


});

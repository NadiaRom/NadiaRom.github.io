// ---------- Map ---------------------------------
d3.json('country_treaties.geojson', function (error, geojson) {
    if (error) {  throw error;  }

    var map = L.map('map', {
        center: [50, 30],
        zoom: 3,
        scrollWheelZoom: false,
        maxBounds: [[-89, -179], [89, 179]]
    });


    map.createPane('labels');
    map.getPane('labels').style.zIndex = 450;
    map.getPane('labels').style.pointerEvents = 'none';

    var CartoDB_PositronNoLabels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
        {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            maxZoom: 12,
            minZoom: 2
        });

    var CartoDB_PositronOnlyLabels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
        {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
            subdomains: 'abcd',
            maxZoom: 12,
            minZoom: 2,
            pane: 'labels'
        });

    function styleFunc(feature) {
        var fill = '';

        if (feature.properties.encountry == 'Ukraine') {
            fill = '#ca93fb';
        } else {
            switch (feature.properties.treaty_stage) {
                case 'проект':
                    fill = '#aadec4';
                    break;
                case 'парафована':
                    fill = '#7ecda8';
                    break;
                case 'підписана':
                    fill = '#6dc69e';
                    break;
                case 'чинна':
                    fill = '#5bc195';
            }
        }
        return {
            fillColor: fill,
            color: '#575a5d',
            weight: 0.5,
            fillOpacity: 0.7
        };
    }

    function moveToCountry() {
        if (this.feature.properties.encountry !== 'Russia') {
            // click to expand country card
            $('div#' + this.feature.properties.encountry)
                .find('.uncollapse-card a i')
                .click();

            $('body').scrollTo($('nav#table-header'), {
                duration: 440
            });

            $('body').scrollTo($('div#' + this.feature.properties.encountry), {
                offset: -$('nav#table-header').height() - 2,
                duration: 0,
                easing: 'linear'
            });

            $('.typeahead').typeahead('val', '');
        }
    }

    function onEachFeature(feature, layer) {
        layer.on({  click: moveToCountry  });
    }

    var jsonForeignLayer = L.geoJSON(geojson, {
        filter: function (feature) {  return feature.properties.encountry != 'Ukraine';  },
        style: styleFunc,
        onEachFeature: onEachFeature
    });

    jsonForeignLayer.bindTooltip(
        function (e) {
            return e.feature.properties.treaty_date == ''
                ? '<p class="tooltip-country"><strong>' + e.feature.properties.uacountry + '</strong><br/>' +
                'Угода: ' + e.feature.properties.treaty_stage + '</p>'
                : '<p class="tooltip-country"><strong>' + e.feature.properties.uacountry + '</strong><br/>' +
                'Угода: ' + e.feature.properties.treaty_stage + '<br/>' +
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

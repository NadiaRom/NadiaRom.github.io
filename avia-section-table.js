d3.json('avia_table.json', function(error, dataset) {
    if (error) {
        throw error;
    }

    // Sort on airlines
    var sortDset = function (dset) {
        dset.sort(function (a, b) {
            var a_total = [], b_total = [];
            [a, b].map(function (d, i) {
                d.conditions.map(function (c) {
                    c.permissions.map(function (p) {
                        p.rights.map(function (r) {
                            if (i < 1) {
                                a_total.push(+r.max_freq);
                            } else {
                                b_total.push(+r.max_freq);
                            }
                        })
                    })
                })
            });

            return d3.descending(d3.sum(a_total), d3.sum(b_total));
        });
        return dset;
    };


    // Get list of all airlines
    var airline_names = [], airline_icao_iata = [], airlines_data = [];

    dataset.map(function (d) {
        d.conditions.map(function (c) {
            c.permissions.map(function (p) {
                p.rights.map(function (r) {
                    if (airline_names.indexOf(r.airline_name) < 0) {
                        airline_names.push(r.airline_name);
                    }
                    var icao_iata = [r.icao_airline, r.iata_airline].join('_');
                    if (airline_icao_iata.indexOf(icao_iata) < 0) {
                        airline_icao_iata.push(icao_iata);
                    }
                })
            })
        })
    });
    airline_names.map(function (d, i) {
        airlines_data.push({'airline_name': d, 'icao_iata': airline_icao_iata[i]});
    });
    airlines_data.map(function (aline, i) {
        var total_flights = [], total_rights = [];
        dataset.map(function (d) {
            d.conditions.map(function (c) {
                c.permissions.map(function (p) {
                    var a_rights = p.rights.filter(function (r) {
                        return r.airline_name == aline.airline_name;
                    });

                    a_rights.map(function (a_r) {
                        total_rights.push(+a_r.max_freq);
                        if (a_r.schedules) {
                            total_flights.push(+a_r.schedules.freq)
                        }
                    });
                });
            });
        });
        airlines_data[i].total_flights = d3.sum(total_flights);
        airlines_data[i].total_rights = d3.sum(total_rights);
        airlines_data[i].airline_removed = false;
    });
    airlines_data = airlines_data.sort(function (a, b) {
        return d3.descending(a.total_rights, b.total_rights);
    });

    // Get rid of ZetAvia, cause only 2 permissions, no data on FlightRadar, and site tells they fly charters to UAE
    // And no ICAO or IATA codes! How???
    airlines_data = airlines_data.filter(function (d) {
        return d.icao_iata !== '_';
    });

    var dataFilterAirline = function (dset) {

        var selectedAirlines = [];
        airlines_data.map(function (a) {
            if (!a.airline_removed) {
                selectedAirlines.push(a.icao_iata.split('_')[0]);
            }
        });

        var filtered_dset = dset;
        filtered_dset.map(function (country, i) {
            country.conditions.map(function (c, j) {
                filtered_dset[i].conditions[j].permissions.map(function (perm, k) {
                    filtered_dset[i].conditions[j].permissions[k].rights = perm.rights.filter(function (r) {
                        return selectedAirlines.indexOf(r.icao_airline) >= 0;
                    });
                });
                filtered_dset[i].conditions[j].permissions = filtered_dset[i].conditions[j].permissions.filter(function (p) {
                    return p.rights.length > 0;
                });
            });
        });

        return filtered_dset;
    };

    var dataset_selected_airlines = JSON.parse(JSON.stringify(dataset));
    dataset_selected_airlines = sortDset(dataset_selected_airlines);

    // ---------- sticky header ----------------------------------------------------------------------------------------

    d3.select('#table-header div#search-form')
        .append('input')
        .attr('type', 'text')
        .attr('class', 'typeahead tt-query form-control')
        .attr('id', 'country-input')
        .attr('spellcheck', 'true')
        .attr('autocomplete', 'off')
        .attr('maxlength', 150)
        .attr('placeholder', 'Знайти країну');

    var countryIds = [];

    $(document).ready(function () {
        var countryEngine = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.whitespace,
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: countryIds
        });

        $('.typeahead').typeahead({
                hint: true,
                highlight: true, /* Enable substring highlighting */
                minLength: 1 /* Specify minimum characters required for showing suggestions */
            },
            {
                name: 'country_search',
                source: countryEngine
            }
        )
    });

    $('.typeahead').on('typeahead:selected typeahead:autocompleted', function (e, val) {
        var selected_country_id = $('div.country-name:contains("' + val + '")').parent().attr('id');
        // click to expand country card
        $('div.country-name:contains("' + val + '")').parent().find('.uncollapse-card a i').click();

        d3.selectAll('div.country-profile-row:not(#' + selected_country_id + ')')
            .classed('hidden-country', true);
        //$('body').scrollTo($('div.country-name:contains("' + val + '")'));
    });

    // Clean form button
    // d3.select('#table-header div#search-form')
    //     .append('button')
    //     .attr('id', 'clear-search')
    //     .append('i')
    //     .attr('class', 'fa fa-times-circle');

    $('button#clear-search').click(function () {
        $('.typeahead').typeahead('val', '');
        d3.selectAll('.row.country-profile-row')
            .classed('hidden-country', false);
        d3.selectAll('.collapse.show').each(function () {
            d3.select(this.parentNode).select('a[aria-expanded=true]').node().click()
        })
    });


    // ----- Dropdown airlines -----

    airlinesFilter = d3.select('div#avia-dropdown-items');

    var select_all_airlines = {
        'airline_name': 'ВСІ',
        'airline_removed': false,
        'icao_iata': airline_icao_iata
    };

    airlinesFilter.selectAll('label')
        .data([select_all_airlines].concat(airlines_data))
        .enter()
        .append('label')
        .attr('class', function (d) {
            var classes = ['dropdown-item'];
            if (d.airline_removed) {
                classes.push('airline-removed');
            }
            return classes.join(' ');
        })
        .attr('id', function (d) {
            if (typeof d.icao_iata == 'object') {
                return 'select-all-checkbox';
            }
        })
        .html(
            function (d) {
                return '<i class="fa fa-plane airline-check-tick"></i>' + '  ' +
                    d.airline_name +
                    '<input class="airline-checkbox custom-control-input" type="checkbox" checked autocomplete="off">';
            }
        );

    d3.selectAll('#avia-dropdown-items label.dropdown-item')
        .filter(function (d) {
            return d.airline_name !== 'ВСІ';
        })
        .attr('title', function (d) {
            return d.icao_iata.split('_')[0];
        });

    // On check box hide elements with specific attribute "airline", which equals ICAO_IATA
    $('input.airline-checkbox').change(function () {
        // Get index of checked airline in airline_data
        var airline_id = this.parentNode.__data__.icao_iata;

        if (typeof airline_id == 'object') {  // if "Show All" selected
            // set all airlines in dataset to 'removed' = false
            airlines_data.map(function (a, i) {
                airlines_data[i].airline_removed = false;
            });
            // paint all icons to pink-selected
            d3.selectAll('.dropdown-item').classed('airline-removed', false);

        } else {
            //get index of selected airline in iarline_data
            var ad_i = airlines_data.findIndex(function (d) {
                return d.icao_iata == airline_id;
            });

            // if at least one airline is already unselected
            if (airlines_data.some(function (a) {
                return a.airline_removed == true;
            })) {
                // change 'removed' value of selected to opposite
                airlines_data[ad_i].airline_removed = !airlines_data[ad_i].airline_removed;
                // paint airline's icon
                d3.select(this.parentNode).classed('airline-removed', function () {
                    return !d3.select(this).classed('airline-removed');
                });
            } else { // if it is first choice of airline, remove all except for selected
                airlines_data.map(function (a, i) {
                    i == ad_i
                        ? airlines_data[i].airline_removed = false
                        : airlines_data[i].airline_removed = true;
                });
                $(this.parentNode).siblings().each(function () {
                    d3.select(this).classed('airline-removed', true);
                    });
            }
        }

        // if all airlines selected - button blank, if not - button classed 'filtered-out'
        if (airlines_data.some(function (a) {
                return a.airline_removed == true;
            })) {
            d3.select('button.dropdown-toggle.btn')
                .classed('items-filtered-out', true);
            d3.select('#select-all-checkbox')
                .classed('airline-removed', true);
        } else {
            d3.select('button.dropdown-toggle.btn')
                .classed('items-filtered-out', false);
            d3.select('#select-all-checkbox')
                .classed('airline-removed', false);
        }

        dataset_selected_airlines = dataFilterAirline(JSON.parse(JSON.stringify(dataset)));
        dataset_selected_airlines = sortDset(dataset_selected_airlines);
        d3.selectAll('div.row.country-profile-row').remove();
        drawTable();
        drawCard();
    });


    // ---------- Table itself -----------------------------------------------------------------------------------------
    // compute total frequencies
    var computeCountryTotal = function (d_country) {
        var totalGiven = [], totalFlights = [];
        d_country.conditions.map(function (c) {
            c.permissions.map(function (p) {
                p.rights.map(function (r) {
                    totalGiven.push(+r.max_freq);
                    if (r.schedules) {
                        totalFlights.push(+r.schedules.freq)
                    }
                });
            });
        });
        return [d3.sum(totalGiven), d3.sum(totalFlights)];
    };

    var totalWidthscale = d3.scaleLinear()
        .domain([0, 250])
        .range([0, 100])
        .clamp(true);


    var drawTable = function () {
        //[dataset_selected_airlines].map(function () {

        var tableSection = d3.select('#table-body');

        var countryRows = tableSection.selectAll('div')
            .data(dataset_selected_airlines)
            .enter()
            .append('div')
            .attr('class', 'row country-profile-row')
            .attr('id', function (d) {
                return d.encoutry;
            });

        // Country label
        var countryName = countryRows.append('div')
            .attr('class', 'col-md-3 col-sm-4 col-xs-4 text-sm-right country-name')
            .attr('id', function (d) {
                return d.encountry;
            })
            .text(function (d) {
                countryIds.push(d.uacountry);
                return d.uacountry;
            });

        var countryTotal = countryRows.append('div')
            .attr('class', 'col-md-7 col-sm-6 col-xs-6 country-total')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '3em');

        var countryTotalRect = countryTotal.selectAll('rect')
            .data(function (d) {
                return [250].concat(computeCountryTotal(d));
            }) // 250 is convenient scale maximum
            .enter()
            .append('rect')
            .attr('x', '10%')
            .attr('y', '0.2em')
            .attr('height', '40%')
            .attr('width', function (d) {
                return totalWidthscale(d) + '%'
            })
            .attr('class', function (d, i) {
                var rect_class;
                switch (i) {
                    case 0:
                        rect_class = 'blank-rect';
                        break;
                    case 1:
                        rect_class = 'permission';
                        break;
                    case 2:
                        rect_class = 'flight';
                        break;
                }
                return 'total-country-frequency ' + rect_class;
            });

        var countryTotalLab = countryTotal.append('text')
            .datum(function (dat) {
                return computeCountryTotal(dat);
            })
            .attr('x', '10%')
            .attr('y', '2em')
            .text(function (d) {
                return d[1] + ' рейсів / ' + d[0] + ' дозволено';
            });

        // !!! Chrome does not support preserveAspectRatio, so still have to define viewBox on our own
        // AND WRITE SVG-coords IN % ! %! %!
        var totalViewBoxSVG = d3.selectAll('.country-total svg')
            .attr('viewBox', function () {
                var bb = this.getBBox();
                return [
                    bb.x,
                    bb.y,
                    bb.width,
                    bb.height
                ].join(' ');
            });

        var uncollapseCard = countryRows.append('div')
            .attr('class', 'col-1 uncollapse-card')
            .attr('id', function (d) {
                return 'collapse-' + d.encoutry;
            })
            .append('a')
            .attr('data-toggle', 'collapse')
            .attr('href', function (d) {
                return '#collapse-card' + d.encoutry;
            })
            .attr('aria-expanded', 'false')
            .attr('aria-controls', function (d) {
                return 'collapse-card' + d.encoutry;
            })
            .append('i')
            .attr('class', 'fa fa-chevron-down')
            .style('color', '#084a44')
            .style('font-size', '2.4vh')
            .style('font-weight', 'lighter');

        countryRows.append('div')
            .attr('class', 'w-100');
    };

    drawTable();


    //--------- CARD ---------------------------------------------------------------------------------------------------

    var drawCard = function() {
        // Create collapsible div
        collapseCard = d3.selectAll('div.country-profile-row')
            .append('div')
            .attr('class', 'col-12 collapse')
            .attr('id', function (d) {
                return 'collapse-card' + d.encoutry;
            })
            .attr('role', 'tabpanel')
            .attr('aria-labelledby', function (d) {
                return 'collapse-' + d.encoutry;
            })
            .attr('data-parent', function (d) {
                return d.encoutry;
            });

        // ---------- Card rights to exploit the route -----------------------------------------------------------------
        var routePermissionsRow = collapseCard.append('div')
            .attr('class', 'row permissions no-left-gutter no-right-gutter');

        // Route permissions heading
        routePermissionsRow.append('div')
            .attr('class', 'col-12 permissions-heading')
            .html('<strong>Надані права на експлуатацію повітряних ліній</strong>,<br/><em>рейсів на тиждень</em>');

        // ----- Draw small multiples of permissions. Include only selected airlines meet within country -----

        // Define general data? padding, axis
        var selected_airlines = [];
        airlines_data.map(function (a) {
            if (!a.airline_removed) {
                selected_airlines.push(a.icao_iata.split('_')[0]);
            }
        });

        var xPaddingPerm = 20;

        // Data for every chart inside chart's <div>, only airlines within country and selected ones
        // In case some airlines are selected, all cities occupied by other airlines will be removed
        var permissionDivs = routePermissionsRow.selectAll('div.permission')
            .data(function (d) {
                // form permission rights array
                // TODO - sort it by city popularity

                var permissions = [];
                var country_airlines = [];
                d.conditions.map(function (c) {
                    c.permissions.map(function (p) {
                        permissions.push(p);
                        p.rights.map(function (r) {
                            // adding airline to list/array if airline is selected and not already in list
                            if ((country_airlines.indexOf(r.icao_airline) < 0) &&
                                (selected_airlines.indexOf(r.icao_airline) >= 0)) {
                                country_airlines.push(r.icao_airline);
                            }
                        })
                    });
                });


                // D3 scales to attach x and y on-fly. **fly**, baby:)))
                var xScalePerm = d3.scaleLinear()
                    .domain([0, 22])
                    .range([xPaddingPerm, 100 - xPaddingPerm])
                    .clamp(true);

                var yAirlineScalePoint = d3.scalePoint()
                    .domain(country_airlines)
                    .range([xPaddingPerm, (100 - xPaddingPerm)]);

                // add scaled values to permission rights array
                permissions.map(function (p, i) {
                    p.rights.map(function (r, j) {
                        permissions[i].rights[j].y = yAirlineScalePoint(r.icao_airline);
                        permissions[i].rights[j].perm_width = xScalePerm(r.max_freq) - 20;
                        permissions[i].rights[j].flight_width = r.schedules ?
                            xScalePerm(r.schedules.freq) - 20 :
                            0;
                        // It is pervertion, but we store FUNCTION in js object! Axis function ... no other way;

                        permissions[i].axis_x_function = d3.axisBottom()
                            .scale(xScalePerm)
                            .tickValues(d3.range(xScalePerm.domain()[0], xScalePerm.domain()[1])
                                .filter(function (d, i) {
                                    return d % 7 == 0;
                                }))
                            .tickSize(2);

                        permissions[i].axis_y_function = d3.axisLeft()
                            .scale(yAirlineScalePoint)
                            .tickSize(2);
                    });
                    permissions[i].rights = permissions[i].rights.sort(function (a, b) {
                        return d3.ascending(
                            airline_icao_iata.indexOf(a.icao_airline + '_' + a.iata_airline),
                            airline_icao_iata.indexOf(b.icao_airline + '_' + b.iata_airline)
                        );
                    });
                });
                // hooooooh, done:)
                return permissions;
            })
            .enter()
            .append('div')
            .attr('class', 'col-xl-2 col-lg-2 col-md-3 col-sm-4 col-xs-6 permission')
            .attr('id', function (d) {
                return d.from_encity.replace(/[\.\s]/gi, '') + '__' + d.to_encity.replace(/[\.\s]/gi, '');
            });

        var permissionSVGs = permissionDivs.append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0, 0, 100, 100');
        // .on('mouseover', function (d) {
        //     var selPath = '#' + d.from_encity + '__' + d.to_encity;
        //     var selFrom = 'text[enname=' + d.from_encity + ']';
        //     var selTo = 'text[enname=' + d.to_encity + ']';
        //     d3.selectAll('svg ' + [selPath, selFrom, selTo].join(', '))
        //         .classed('wow-mouseover', true);
        //
        // })
        // .on('mouseout', function (d) {
        //     var selPath = '#' + d.from_encity + '__' + d.to_encity;
        //     var selFrom = 'text[enname=' + d.from_encity + ']';
        //     var selTo = 'text[enname=' + d.to_encity + ']';
        //     d3.selectAll('svg ' + [selPath, selFrom, selTo].join(', '))
        //         .classed('wow-mouseover', false);
        // });

        // draw permission bars, same classes as in major bar. In need to style differently, add selector by div class
        var permissionBars = permissionSVGs.selectAll('rect.permission')
            .data(function (d) {
                return d.rights;
            })
            .enter()
            .append('rect')
            .attr('class', 'permission')
            .attr('x', xPaddingPerm)
            .attr('y', function (d) {
                return d.y;
            })
            .attr('height', 5)
            .attr('width', function (d) {
                return d.perm_width;
            });

        var permissionFlightBars = permissionSVGs.selectAll('rect.flight')
            .data(function (d) {
                return d.rights;
            })
            .enter()
            .append('rect')
            .attr('class', 'flight')
            .attr('x', xPaddingPerm)
            .attr('y', function (d) {
                return d.y;
            })
            .attr('height', 5)
            .attr('width', function (d) {
                return d.flight_width;
            });


        // Simply call on permissionSVGs does not work TODO fix
        d3.selectAll('div.permission svg')
            .each(function (svg) {
                d3.select(this)
                    .append('g')
                    .attr('class', 'frequency-axis-x')
                    .attr('transform', 'translate(0, 90)')
                    .call(svg.axis_x_function);

                d3.select(this)
                    .append('g')
                    .attr('class', 'airlines-axis-y')
                    .attr('transform', 'translate(19, 2.5)')
                    .call(svg.axis_y_function);
            });

        // Route header
        permissionSVGs.append('text')
            .attr('class', 'route-header')
            .attr('x', 3)
            .attr('y', 13)
            .text(function (d) {
                return d.from_city + ' - ' + d.to_city
            });

        // add flights-per-week label
        d3.selectAll('div.country-profile-row div.permissions')
            .each(function (div) {
                d3.select(this)
                    .select('svg')
                    .append('text')
                    .attr('class', 'flights-per-week-lab')
                    .attr('x', 1)
                    .attr('y', 100)
                    .text('р/т');
            });
        // --- Airline ICAO tooltip
        d3.selectAll('.airlines-axis-y g.tick text')
            .attr('class', 'airline-icao-tooltipped')
            .attr('title', function (d) {
                return airlines_data.filter(
                    function (a) {
                        return a.icao_iata.split('_')[0] == d;
                    })[0].airline_name;
            })
            .attr('data-toggle', 'airline-icao-tooltipped')
            .attr('data-placement', 'right');

        // Airline tooltip
        $(function () {
            $('[data-toggle="airline-icao-tooltipped"]').tooltip()
        });

        d3.selectAll('div.permissions rect')
            .classed('permission-bar-tooltipped', true)
            .attr('title', function (d) {
                return d.schedules
                    ? 'до <strong>' + d.max_freq + '</strong> р/т,<br/><strong>' + d.schedules.freq + '</strong> за розкладом'
                    : 'до <strong>' + d.max_freq + '</strong> р/т';
            })
            .attr('data-toggle', 'permission-bar-tooltipped')
            .attr('data-placement', 'bottom')
            .attr('data-html', true);

        // Flight right tooltip
        $(function () {
            $('[data-toggle="permission-bar-tooltipped"]').tooltip()
        });

        // ---------- Table of treaty conditions -----------------------------------------------------------------------
        var treatyConditionsRow = collapseCard.append('div')
            .attr('class', 'row treaty no-left-gutter no-right-gutter');

        treatyConditionsRow.append('div')
            .attr('class', 'col-12 treaty-heading')
            .html('<strong>Умови розподілу рейсів за міжнародною угодою</strong>');

        var treatyTableRow = treatyConditionsRow.selectAll('div.treaty-table-col-main')
            .data(function (d) {
                return d.conditions;
            })
            .enter()
            .append('div')
            .attr('class', 'col-12 treaty-table-col-main')
            .append('div')
            .attr('class', 'row no-gutters treaty-table-row')
            .attr('id', function (d) {
                return [
                    d.en_from.replace(/[\.\s]/gi, ''),
                    d.en_to.replace(/[\.\s]/gi, '')
                ].join('__');
            });

        var routes = treatyTableRow.append('div')
            .attr('class', 'col-sm-4 col-xs-12 country-routes-diagram');

        var treatyFlightLimits = treatyTableRow.append('div')
            .attr('class', 'col-sm-4 col-xs-12 treaty-flight-limits');

        var treatyAirlineLimits = treatyTableRow.append('div')
            .attr('class', 'col-sm-4 col-xs-12 treaty-airline-limits');

        // Table headers
        routes.append('h6')
            .attr('class', 'limit-heading')
            .text('Маршрути');
        treatyFlightLimits.append('h6')
            .attr('class', 'limit-heading')
            .text('Обмеження рейсів');
        treatyAirlineLimits.append('h6')
            .attr('class', 'limit-heading')
            .text('Обмеження авіакомпаній');

        var uaRouteList = routes.append('p')
            .attr('class', 'ua-points')
            .html(function (d) {
                return d.ua_from.split('--').join(', ');
            });

        var foreignRouteList = routes.selectAll('p.foreign-points')
            .data(function (d) {  return d.ua_to.split('--');  })
            .enter()
            .append('p')
            .attr('class', 'foreign-points')
            .html(function (d) {
                return '<i class="fa fa-plane"></i>' + ' ' + d;
            });


        var freqLimits = treatyFlightLimits.selectAll('p.flight-limits-val')
            .data(function (d) {
                return d.limits.flights;
            })
            .enter()
            .append('p')
            .attr('class', 'flight-limits-val')
            .html(function (d) {
                var limit = d.limit == 999 ? 'немає' : d.limit;
                if (d.scope) {
                    return '<p>' + d.scope_text + '<br/>' +
                        '<span class="limit-figure">' + limit + '</span>' + ' р/т' + '</p>';

                } else {
                    return '<p class="unlimited-limit">без обмежень</p>';
                }
            });

        var airlineLimits = treatyAirlineLimits.selectAll('p.airline-limits-val')
            .data(function (d) {
                return d.limits.airlines;
            })
            .enter()
            .append('p')
            .attr('class', 'airline-limits-val')
            .html(function (d) {
                var limit = d.limit == 999 ? 'немає' : d.limit;
                if (d.scope) {
                    return '<p>' + d.scope_text + '<br/>' +
                        '<span class="limit-figure">' + limit + '</span></p>';

                } else {
                    return '<p class="unlimited-limit">без обмежень</p>';
                }
            });

    };

    //     // ---------- Route SVG ----------
    //     var routeSvg = routeDiagram.append('svg')
    //         .attr('width', '100%')
    //         .attr('heigh', '100%')
    //         .attr('viewBox', '0 0 100 100');
    //
    //     //----- Function to define coordinates of text and path of route diagram -----
    //     var pointCoords = function (dat) {
    //         var points = [];
    //
    //         var from_en_points = dat.en_from.split('--');
    //         var from_ua_points = dat.ua_from.split('--');
    //         var to_en_points = dat.en_to.split('--');
    //         var to_ua_points = dat.ua_to.split('--');
    //
    //         var uaYScalePoint = d3.scalePoint()
    //             .domain(d3.range(from_en_points.length))
    //             .range([10, 90]);
    //         var foreignYScalePoint = d3.scalePoint()
    //             .domain(d3.range(to_ua_points.length))
    //             .range([10, 90]);
    //
    //         from_en_points.map(function (point, i) {
    //             points.push({
    //                 'en_point': point,
    //                 'ua_point': from_ua_points[i],
    //                 'isua': true,
    //                 'y': uaYScalePoint(i),
    //                 'x': 40
    //             });
    //         });
    //         to_en_points.map(function (point, i) {
    //             points.push({
    //                 'en_point': point,
    //                 'ua_point': to_ua_points[i],
    //                 'isua': false,
    //                 'y': foreignYScalePoint(i),
    //                 'x': 60
    //             });
    //         });
    //         return points;
    //     };
    //
    //     var routeCircles = routeSvg.selectAll('circle.point')
    //         .data(function (d) {  return pointCoords(d);  })
    //         .enter()
    //         .append('circle')
    //         .attr('cx', function (d) {  return d.x;  })
    //         .attr('cy', function (d) {  return d.y;  })
    //         .attr('r', '1px')
    //         .attr('class', function (d) {  return d.isua ? 'point ua' : 'point foreign';  });
    //
    //     var routeLabels = routeSvg.selectAll('text.label')
    //         .data(function (d) {  return pointCoords(d);  })
    //         .enter()
    //         .append('text')
    //         .attr('x', function (d) {  return d.isua ? d.x - 4 : d.x + 4;  })
    //         .attr('y', function (d) {  return d.y;  })
    //         .attr('class', function (d) {  return d.isua ? 'label ua' : 'label foreign';  })
    //         .selectAll('tspan')
    //         .data(function (d) {
    //             if (d.ua_point.indexOf('-') >= 0) {
    //                 var splitDash = d.ua_point.split('-');
    //                 splitDash.map(function (part, i) {
    //                     splitDash[i] = i < splitDash.length - 1
    //                         ? part + '-'
    //                         : part;
    //                 });
    //                 return splitDash;
    //             } else if (d.ua_point.indexOf(' ') >= 0) {
    //                 return d.ua_point.split(' ');
    //             } else {
    //                 return [d.ua_point];
    //             }
    //         })
    //         .enter()
    //         .append('tspan')
    //         .attr('x', function () {
    //             return this.parentNode.__data__.isua ?
    //                 this.parentNode.__data__.x - 4 :
    //                 this.parentNode.__data__.x + 4;
    //         })
    //         .attr('dy', function (d, i) {  return i * 0.85 + 'em'  })
    //         .text(function (d) {  return d != 'NA' ? d : 'не визначено';  });
    //
    //     // SVG path between all routes
    //     var routePath = routeSvg.selectAll('path.routeline')
    //         .data(function (d) {
    //             var point_pairs = [];
    //
    //             var point_coords_data = pointCoords(d);
    //             var ua_points = point_coords_data.filter(function (po) {
    //                 return po.isua;
    //             });
    //             var foreign_points = point_coords_data.filter(function (po) {
    //                 return !po.isua;
    //             });
    //
    //             ua_points.map(function (ua) {
    //                 foreign_points.map(function (foreign) {
    //                     point_pairs.push({
    //                         'xua': ua.x,
    //                         'yua': ua.y,
    //                         'xfrgn': foreign.x,
    //                         'yfrgn': foreign.y,
    //                         'id': ua.en_point + '__' + foreign.en_point
    //                     });
    //                 });
    //             });
    //             return point_pairs;
    //         })
    //         .enter()
    //         .append('path')
    //         .attr('class', 'routeline')
    //         .attr('d', function (d) {
    //             return d.yua < d.yfrgn
    //
    //                 ? 'M' + d.xua + ',' + d.yua +
    //                 ' A 115,115 0 0 1 ' +
    //                 d.xfrgn + ',' + d.yfrgn
    //
    //                 : 'M' + d.xua + ',' + d.yua +
    //                 ' A 115,115 0 0 0 ' +
    //                 d.xfrgn + ',' + d.yfrgn;
    //         })
    //         .attr('id', function (d) {  return d.id;  });
    //
    //
    // };

    drawCard();

    // Change icon and add border to card on uncollapse
    $('.collapse').on('shown.bs.collapse', function () {
        d3.select(this.parentNode)
            .classed('card-open', true);

        d3.select(this.parentNode)
            .select('a i')
            .attr('class', 'fa fa-chevron-up');
    });

    $('.collapse').on('hidden.bs.collapse', function () {
        d3.select(this.parentNode)
            .classed('card-open', false);

        d3.select(this.parentNode)
            .select('a i')
            .attr('class', 'fa fa-chevron-down');
    })








});

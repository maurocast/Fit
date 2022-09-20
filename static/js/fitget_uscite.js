        /**
        *  Visualizzazione percorsi uscita.
            Viene eseguita con due pararmetri: Il valore e il tipo
            tipo=0 data
            tipo=1 milestone
            per effettuare i filtri
        */
async function fitget_uscite(value, tipo) {
    /*
        impostazioni google per tabella
    */
    google.load("visualization", "1", { packages: ["table"] });
    /*
        reperimento dati da db - get_fit_tes - testata movimenti.
        ordine per data uscita descend
    */ 
    async function get_fit_tes() {
        return new Promise(function (resolve, reject) {
            pr._type = "SQL_ALL";
            pr._sql = "select * from get_fit_tes";
            pr._param = [];
            load(pr).
                then(function (result) {
                    resolve(result)
                })
                .catch(function (err){
                    alert("errore routine get_fit_tes")
                })
        })
    };
    fit_tes = await get_fit_tes()
    /*
        elaborazione tabella per dati 
    */ 
    async function tabellaTestata(fit_tes, value, tipo) {
    /* definizione dati - header */ 
    var data = new google.visualization.DataTable();
    /* campo hidden timestamp */
    data.addColumn({ type: "date", label: "" }) 
    /* impostazione data-filtro */
    async function get_filterData() {
        return new Promise(function (resolve, reject) {
            resolve("<input type='date' id='dataUscita' name='dataUscita'  " +
                "onchange='fitget_uscite(dataUscita.value,0)'></input>")
        })
    }
    filterData = await get_filterData()
    data.addColumn({ type: "string", label: "Data " + filterData })
    /*
        itinerario e filtro
    */
    async function get_filterMilestone() {
        return new Promise(function (resolve, reject) {
            pr._type = "SQL_ALL";
            pr._sql = "select * from fit_milestone order by city,indirizzo";
            pr._param = [];
            load(pr)
                .then(function (result) {
                    s =
                        "  <select name='selectMilestone' id='selectMilestone' onchange='fitget_uscite(value,1)'> ";
                    s += "<option value='Seleziona:'>Seleziona</option>"
                    result.forEach(function (element) {
                        s +=
                            "<option value='" +
                            element.indirizzo + " " + element.city +
                            "'>" +
                            element.indirizzo + " " + element.city +
                            "</option>";
                    });
                    s += "</select > ";
                    resolve(s)
                })
                .catch(err => alert("errore selezione milestone"))
        })
    }
    filterMilestone = await get_filterMilestone()
    data.addColumn({ type: "string", label: "Itinerario " + filterMilestone }); // elenco milestones
    /*
        definizione dati - dettaglio
        verifico se filtrare i dati
        se value esiste filtra i dati
    */
    function fnc_checkfiltered(value, tipo,fit_tes) {
        if (tipo != undefined && value != 'Seleziona:') {
            if (tipo == 0) {
                data_grafico_testata = fit_tes.filter(function (rec) {
                    // data richiesta
                    return rec.data >= value
                })
            }
            else {
                data_grafico_testata = fit_tes.filter(function (rec) {
                    // contiene nella testata questo milestone
                    return rec.tragitto.includes(value)
                })
            }
            return data_grafico_testata 
        }
        else
        {
            return fit_tes
            }
    }
    fit_tes = fnc_checkfiltered(value, tipo, fit_tes)
    /*
        elaborazione del dettaglio
    */
    fit_tes.forEach(function (item) {
        data.addRow([
            /** elaboro la data ricevuta in formato text ( view ) */
            fnc_data(item.data, "d"), // data
            fnc_data(item.data, "s"), // stringa data
            item.tragitto,            // tragitto
        ]);  
    });
    /*
        div che contiene la tabella
    */ 
    var table = new google.visualization.Table(
        document.getElementById("div_container")
    );
    /*
        view della tabella
    */ 
    var view = new google.visualization.DataView(data);
    view.setColumns([1, 2]); // colonna 0 - data - hidden
    /*
        emissione tabella con options
    */
    var options = {
        sort: 'event',   // eliminato sort automatico
        cssClassNames: dc.cssClassNames,
        pageSize: 15,
        allowHtml: true,
        page: "enable",
        width: "100%",
        height: "100%",
    };    
    table.draw(view, options);
    /**
    *    evento seleziona visualizza la map e tutti i layers 
    *   associati con menu per la scelta
    */ 
    function selectTableTestata(e) {
        /**
        *   riga relativa alla selezione
        */
        riga_selezionata = fit_tes[table.getSelection()[0].row]
        /*
        *   impostazioni map 
        */ 
        removeContainerFromMap('map_div')
        var map = new L.map("map_div")
        removeLayersFromMap(map) 
        /**
         * Attesa ( con z-indez minore della map)
         */
        fnc_wait("map_div")           
        /**
         *  Visualizzazione mappa e leaflet
         */
        async function fitget_layers_uscita(map, riga_selezionata) {
            /**
             * Non visualizzazione menu
             */
            hidden_div(["div_menu1"], ["div_visualizzazione"], []);
            /**
             * punti del tragitto per polylyne 
             */
            async function get_fit(data) {
                return new Promise(function (resolve, reject) {
                    pr._type = "SQL_ALL";
                    pr._sql = "select * from get_fit where data = ?";
                    pr._param = data;
                    load(pr)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(function (err) {
                            alert("errore")
                        })
                })
            }
            get_fit = await get_fit(riga_selezionata.data.substr(0, 10))
            /**
             * Elaborazione polyline
             * @param {*} map 
             * @returns polyline
             */
            async function get_polyline(map){
                return new Promise(function (resolve, reject) {
            /*
                Creazione polyline vuoto, attivato da layer control
            */    
            polyline = new L.polyline([], { color: "red", })
            /*
                Click su polyline per attivare la creazione di
                un nuovo milestone
            */
            polyline.on('click', function (e) {
                popup = L.popup({
                    closeOnClick: false,
                    autoClose: false,
                    maxHeight: 700, minWidth: 400,
                })
                popup.setLatLng(e.latlng)
                /**
                 * dati che vengono visualizzati sulla popup
                 */
                document.getElementById("lblCoordinate").
                    innerHTML = "Coordinate: " +
                    e.latlng.lat.toFixed(5) + ", " + e.latlng.lng.toFixed(5)
                document.getElementById("buttonNuovoMilestone").
                    addEventListener("click", function () {
                /*
                    creazione di un nuovo milestone 
                */
                async function scrivi_record_milestone(lat, lng, altitude) {
                /*
                * effettuo la request sul server per reperire l'altitudine
                * del punto sul quale viene creto il milestone
                * 
                */
                pr._type = "REQUEST";
                pr._param = lat + "," + lng + "|"
                load(pr)
                    .then(function (result) {
                        if (result.status != 'INVALID_REQUEST') {
                            altitude = Math.round(result.results[0].elevation)
                        }
                        else
                        { altitude = 0 }
                        
                    })
    }
                    /*
                        Scrivo il record su fit_milesone
                    */
                    function scrivi_record_milestone(lat, lng, altitude) {
                            return new Promise(function (resolve, reject) {
                                pr._type = "SQL_RUN";
                                pr._sql = "insert into fit_milestone (lat,lon,indirizzo,city,radius,altitude) " +
                                    " values(?,?,?,?,?,?)"
                                // passo nei parametri i dati per il nuovo milestone
                                pr._param = [[lat, lng, document.getElementById("indirizzo").value,
                                    document.getElementById("city").value, document.getElementById("radius").value, altitude]]
                                load(pr).then(function (result) {
                                    resolve(result)
                                })
                            })
                    }
                    scrivi_record_milestone(e.latlng.lat, e.latlng.lng, 0)
                    .then(function (result) {
                        map.closePopup();
                    })
                })
                /**
                 * visualizzo il div e la popup
                 */
                hidden_div([], ["div_popupMilestone"], []);
                popup.setContent(document.getElementById("div_popupMilestone"))
                popup.openOn(map);
            });
                    resolve(polyline)
                })
                    .catch(err => alert("errore"))
            }
            polylyne = await get_polyline(map)
            /**
             * Elaborazione markerMoving solo definizione
             * @param {*} get_fit 
             * @param {*} map 
             * @returns markerMoving
             */
            function get_moving(get_fit, map) {

                // definizione dell icona personalizzata
                function define_bike() {
                    return L.icon({
                        iconUrl: 'bike.png',
                        iconSize: [20, 20],
                    });
                }
                var bike = define_bike()

                // definizione delle array per il moving
                lastlatlng = 0
                latlng = []   // lat e lon del moving marker
                dur = []      // durata in millesecondi del movimento
                tim = []      // array delle date dei punti 
                mil = []      // indice della sk al punto del milestone  
                inizia = ""
                get_fit.forEach(function (el, ct) {
                    if (el.mil != 0 && inizia == 0) { inizia = 1 }
                    if (inizia == 1) {
                        dur.push(15)
                        latlng.push([el.lat, el.lng])
                        tim.push(el.timestamp_key)
                        if (el.mil != 0) { mil.push(ct) }
                    }
                })
                // creazione ed esecuzione con autostrat del moving
                function define_marker(latlng, dur, bike) {
                    return L.Marker.movingMarker(latlng, dur,
                        {
                            autostart: false,
                            icon: bike,
                        }) 
                };
                var markerMoving = define_marker(latlng, dur, bike)

                return markerMoving
            }
            markerMoving = get_moving(get_fit, map)                
            
                // milestones uscita
            async function get_fit_itinerario(data) {
                return new Promise(function (resolve, reject) {
                    pr._type = "SQL_ALL";
                    pr._sql = "select * from get_fit_itinerario where data=? order by fine";
                    pr._param = [[data]];
                    load(pr)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(err => alert("errore"))
                })
            }
            fit_itinerario = await get_fit_itinerario(riga_selezionata.data.substr(0, 10).toString())
            /**
            * elaborazione completa del markerMoving
            */
            altit = []
            fit_itinerario.forEach(function (el, ct) {
                async function get_milestone(el, map, ct) {
                    
                    /**
                     * creazione marker per milestone
                     * @param {*} el 
                     * @param {*} ct 
                     * @returns 
                     */
                    function milestone_itinerario(el, ct) {
                        if (ct > 0) {
                            var myIcon = new L.divIcon()
                            mil_e = []
                            dc.layers_uscita.eachLayer(function (layer) {
                                mil_e.push(layer.options.dat.mil_a)
                            })

                            if (mil_e.indexOf(el.mil_a, 0) != -1) {
                                myIcon = L.divIcon({
                                    html: '<div></div> '
                                });
                            }
                            else {
                                myIcon = L.divIcon({
                                    html: '<div class="circle-icon">' +
                                        el.indirizzo_a + " " + "m." + el.altitude +
                                        '</div> '
                                });
                            }

                        }
                        else {
                            myIcon = L.divIcon({
                                html: '<div class="circle-icon">' +
                                    "Inizio: " + el.indirizzo_a + " " + "m." + el.altitude +
                                    '</div> '
                            });
                        }
                        m = new L.Marker([el.lat, el.lon],
                            { icon: myIcon, dat: el })
                        altit.push(el.altitude)
                        return m
                    }
                    m = milestone_itinerario(el, ct)
                    /**
                     * Aggiungo i cm ai vari group layer
                     */
                    m.addTo(dc.layers_uscita)
                    /**
                     * altitudine precedente
                     */
                    if (/*m.options.dat.altitude >= 300 &&*/
                        m.options.dat.altitude > altit[ct-1])
                    { m.addTo(dc.layers_uscitamaggiori) }
                    else
                    { m.addTo(dc.layers_uscitaminori) }
                    // creo la tabella google Chart per ogni mil_a
                    // popup 
                    m.on("click", function (e) {
                        // latlng dove aprire la popup ( da cm )
                        popup_latlng = e.latlng
                        // impostazioni google
                        google.load("visualization", "1", { packages: ["table"] });
                        // Visualizzazione
                        google.charts.setOnLoadCallback(function () {
                            // seleziona tutte le tratte di arrivo
                            pr._type = "SQL_ALL";
                            pr._sql = "select * from get_fit_itinerario where mil_a=? order by mil_da";
                            pr._param = [[el.mil_a]];
                            load(pr)
                            .then(function (result) {
                                function intestazione_grafico_popup(result) {
                                    return result[0].mil_a + " " + result[0].indirizzo_a
                                        + " alt. m. " + result[0].altitude
                                }
                                popup = L.popup({
                                    closeOnClick: false,
                                    autoClose: false,
                                    maxHeight: 700, minWidth: 400,
                                })
                                    // aggiungo il div contenitore
                                    .setContent(
                                        '<div id=divpopup' + el.mil_a +  ' class="div_popupMilestone">' +
                                        '<div id="divIntest_id">' +
                                        intestazione_grafico_popup(result) + '</div>' +
                                        '<div id="divchart_id"></div></div>')
                                    // latlng
                                    .setLatLng(popup_latlng)
                                    // visualizzo
                                    .openOn(map)
                                // dati popup
                                dc.data_grafico_mil_popup = result
                                // creo il grafico Popup e il div contenitore
                                Chart_popup()
                            })
                        })
                    });
                }
                get_milestone(el, map, ct);
            })
            /**
             * Elaborazione Control visualizzazione/Hide
             */
            async function layer_control_uscite(map) {
                /**
             * definizione del layer control
             */
                groupvuoto = new L.FeatureGroup()
                var baseMaps = {
                    "Milestones:tutti": dc.layers_uscita,
                    '    ""     : salite': dc.layers_uscitamaggiori,
                    '    nessun milestone ': groupvuoto,
                };
                var overlayMaps = {
                    'Visualizza Itinerario': polyline,
                    'Bike': markerMoving,
                   
                };
                var layerControl = L.control.layers(
                    baseMaps,
                    overlayMaps,
                    { collapsed: false }
                ).addTo(map);
                /**
                 * aggiungo menu
                 */
                var elements = layerControl._container.getElementsByClassName('leaflet-control-layers-list');

                var button = L.DomUtil.create('button', 'div_menu_orizzontale_layer', elements[0]);
                button.innerHTML = '<div id="ricalcolaMilestones" class="item_menu">Ricalcola</div><div id="ChiudiMap" class="item_menu">Chiudi</div>';
                /**
                * ricalcolo milestones
                */
                var button = L.DomUtil.get('ricalcolaMilestones');
                L.DomEvent.on(button, 'click', async function (e) {
                    L.DomEvent.stop(e);

                    async function ricalcoloMilestones(data) {
                        return new Promise(function (resolve, reject) {    //    div.addEventListener("click", function () {
                            pr._type = "SQL_ALL";
                            pr._sql = "Select * from fit_tes where data=? ";
                            pr._param = data;
                            load(pr).then(function (result) {
                                // delete testata
                                if (result != [] && result != 0) {
                                    // viene eseguita l'importazione di questo file, dopo la cancellazione
                                    // del file di testata
                                    pr._fileDaElaborare = result[0].file;
                                    pr._type = "SQL_RUN";
                                    pr._sql = "delete from fit_tes where data=? ";
                                    pr._param = data;
                                    // delete testata
                                    load(pr)
                                        .then(function (result) {
                                            // importazione
                                            get_import();
                                        });
                                }
                                else {
                                    alert("File in data " + data + " non trovato.");
                                }
                            })
                            resolve("ok")
                        })
                    }
                    await ricalcoloMilestones(riga_selezionata.data)
                        .then(function (result) {
                            layerControl._collapse();
                        })

                });
                /**
                 * Chiudi
                 */
                var button = L.DomUtil.get('ChiudiMap');
                L.DomEvent.on(button, 'click', function (e) {
                    L.DomEvent.stop(e);
                    hidden_div(["div_visualizzazione", "map_chart_uscita"], ["div_container"], []);
                    if (map && map.remove) {
                        map.off();
                        map.remove();
                    }
                    fitget_uscite()
                });
                /**
                 * list milesones
                 */
                var list = L.DomUtil.create('div', '', elements[0]);
                dc.layers_uscita.eachLayer(function (layer) {
                    list.innerHTML +=
                        "m. " + layer.options.dat.altitude + "  " +
                        layer.options.dat.indirizzo_a + '<br>';
                });
                /**
                 * Visualizzazione Hider
                 */
                map.on('overlayadd', async function (event) {
                    /**
                     * Visualizzo itinerario latlng già definito
                     */
                    if (event.name == 'Visualizza Itinerario') {
                        polyline.setLatLngs(latlng)
                    //    groupLayerPic = new L.FeatureGroup()
                    /**    async function get_groupLayerPic(latlng) {
                            return new Promise(function (resolve, reject) {
                                divisore = parseInt(latlng.length / 10)
                                y = divisore
                                imageUrl = 'arrow.jpg'
                                while (y < latlng.length - (divisore)) {
                                    //    imageUrl = L.divIcon({ html: '<div class="arrow"></div>' })   

                                    start_latitude = latlng[y][0]
                                    start_longitude = latlng[y][1]
                                    stop_latitude = latlng[y + 150][0]
                                    stop_longitude = latlng[y + 150][1]

                                    var yy = Math.sin(stop_longitude - start_longitude) * Math.cos(stop_latitude);
                                    var xx = Math.cos(start_latitude) * Math.sin(stop_latitude) -
                                        Math.sin(start_latitude) * Math.cos(stop_latitude) * Math.cos(stop_longitude - start_longitude);
                                    var brng = parseInt(Math.atan2(yy, xx) * 180 / Math.PI);
                                    if (brng < 0) {
                                        brng = (brng * -1) + 180
                                    }
                                    //        im = L.imageOverlay(imageUrl, [[latlng[y][0] + 0.003, latlng[y][1] + 0.003],
                                    //            [latlng[y][0] - 0.003, latlng[y][1] - 0.003]])
                                    myIcon = L.divIcon({
                                        html: '<div class="arrow u">' + brng.toString() + '</div>'
                                    });

                                    if (brng > 45) {
                                        myIcon = L.divIcon({
                                            html: '<div class="arrow r">' + brng.toString() + '</div>'
                                        });
                                    }
                                    if (brng > 135) {
                                        myIcon = L.divIcon({
                                            html: '<div class="arrow d">' + brng.toString() + '</div>'
                                        });
                                    }
                                    if (brng > 225) {
                                        myIcon = L.divIcon({
                                            html: '<div class="arrow l">' + brng.toString() + '</div>'
                                        });
                                    }
                                    if (brng > 315) {
                                        myIcon = L.divIcon({
                                            html: '<div class="arrow u">' + brng.toString() + '</div>'
                                        });
                                    }
                                    L.marker(latlng[y], { icon: myIcon }).addTo(groupLayerPic);



                                    y += divisore
                                }
                                resolve(groupLayerPic)
                            })
                        }
                         */
                        polyline.addTo(map)
                    //    groupLayerPic = await get_groupLayerPic(latlng)
                    //    groupLayerPic.addTo(map)
                    }
                    /**
                     * Visualizzo tutti i milestones
                     */
                    if (event.name == "Milestones:tutti") {
                        //    dc.layers_uscitaminori.addTo(map)
                        //    dc.layers_uscitamaggiori.addTo(map)
                    }
                    if (event.name.includes(": salite")) {
                        //        dc.layers_uscitamaggiori.addTo(map)
                        map.removeLayer(dc.layers_uscita)
                    }
                    if (event.name == 'Bike') {
                        polyline.setLatLngs(latlng)
                        polyline.addTo(map)
                        markerMoving.start()
                        // se è attivo il movimento
                        if (markerMoving.isRunning()) {
                            //    markerMoving.addTo(map)
                            // ogni 2 secondi verifico se il movimento
                            // ha passato la posizione del tooltip e quindi
                            // lo visualizzo
                            var found = 0
                            function fncloop() {
                                // leggo tutti i cm generati precedentemente
                                dc.layers_uscita.eachLayer(function (layer) {
                                    // se la key data ora del movimento
                                    // è superiore alla data del marker lo aggiungo
                                    // alla map e quindi lo visualizzo
                                    if (tim[markerMoving._currentIndex] >= layer.options.dat.fine) {
                                        if (map.hasLayer(layer) == false) {
                                            layer.addTo(map)
                                            //   hideOverlappingPopup(layer, markerMoving)
                                        }
                                        // found contiene l'indice dell'array maggiore
                                        // o uguale all'indice del moviing

                                        isLargeNumber = (element) => element > markerMoving._currentIndex;

                                        found = mil.findIndex(isLargeNumber);

                                        // non trovato perchè è arrivato alla fine
                                        // creo l'ultimo tratto
                                        if (found == -1) {
                                            clearInterval(markerInterval);
                                            markerMoving.stop()
                                            partiallatlng = latlng.slice(lastlatlng, mil[mil.length - 1]);
                                        }
                                        else {
                                            // contiene le lat long dall'ultimo seguito
                                            // fino all'attuale 
                                            partiallatlng = latlng.slice(lastlatlng, mil[found]);
                                            // salvo l'ultimo indice utilizzato
                                            lastlatlng = mil[found] + 1
                                            retrive_layer(dc.layers_uscita, found)
                                        }
                                        // aggiungo comunque al polyline in corso
                                        for (latlongp of partiallatlng) { polyline.addLatLng(latlongp) };

                                    }
                                })
                            }
                            function retrive_layer(glayer, found) {
                                i = 0
                                glayer.eachLayer(function (layer) {
                                    if (i < found) {
                                        if (map.hasLayer(layer) == false) {
                                            layer.addTo(map)
                                            //    hideOverlappingPopup(layer, markerMoving)
                                        }
                                        i += 1
                                    }
                                })
                            }
                            const markerInterval = setInterval(fncloop, 2000);
                        }
                    }
                });
                map.on('overlayremove', function (event) {
                    if (event.name == 'Visualizza Itinerario') {
                        map.removeLayer(polyline)
                        map.removeLayer(groupLayerPic)
                    }
                    if (event.name == "Milestones:tutti") {
                        //                    map.removeLayer(dc.layers_uscitaminori)
                        //                    map.removeLayer(dc.layers_uscitamaggiori)
                    }
                    if (event.name.includes(": salite")) {
                        map.removeLayer(dc.layers_uscitaminori)
                    }
                    if (event.name == 'Itinerario') {
                        map.removeLayer(polyline)
                    }
                    if (event.name == 'Bike') {
                        map.removeLayer(polyline)
                        map.removeLayer(markerMoving)
                    }
                });
            };
            await layer_control_uscite(map)
            map.fitBounds(markerMoving._latlngs);
            tileMap(map)
        }
        fitget_layers_uscita(map, riga_selezionata);
        /**
         * Visualizzazione menu
         */
        hidden_div([], ["map_table_charts"], ["div_menu1"]);
        /**
         * visualizzo la data
         */               
        document.getElementById("div_dataselezionata").innerHTML =
            fnc_data(riga_selezionata.data, "s")
    };
    google.visualization.events.addListener(table, "select",
        selectTableTestata);
    /*
        evento sort
    */ 
    google.visualization.events.addListener(table, 'sort',
        function (e) { })
    };
    google.charts.setOnLoadCallback(function () {
        tabellaTestata(fit_tes,value,tipo);
    });
}
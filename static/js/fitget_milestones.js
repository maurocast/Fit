/*
Visualizzazione salite da menu
Visualizzazione delle salite
come da tabella fit_salite ( da.. a.. )
@param=none
@return=none
*/

async function fitget_milestones()
{
    //
    // emissione div loader con bicicletta e dicitura di attesa
    // il div loader viene poi sovrascritto dal div_map ( z-order 2)
    //
    fnc_wait("map_div")
    // visualizzazione div_visualizzazione che raccoglie tutti i dati per la map
    // menu orizzontale sopra la mappa non visualizzato
    //
    hidden_div(["div_menu1"], ["div_visualizzazione"], []);
    // visualizzazione milestone e tooltip
    //
    // visualizzazione tutte le salite suddivise in gruppi
    // per altitudine
    async function get_salite_rows() {
        return new Promise(function (resolve, reject) {
            // Inizio e fine delle salite
            pr._type = "SQL_ALL";
            pr._sql = "select * from get_salite"
            pr._param = [];
            // reperimento dati 
            load(pr).then(function (result) {
                resolve(result)
            })
        })
    }
    get_salite_rows()
    // creazione oggetti map relativi alle salite 
    .then(function (result) {
    // creazione Cicle Marker e ToolTip
    // Viene generato un circle marker per l'arrivo di colore più scuro
    // secondo l'altezza. il Tool tip riporta l'indicazione dell'altezza
    // creazione dei circle Marker per l'arrivo e Tooltip GroupLayers
    salite_rows=result
    async function crea_layers(salite_rows) {
        return new Promise(function (resolve, reject) {
            // salite_rows ordinato per lat e lng finali per evitare di
            // caricare due volte la stessa fine salita
            // carica solo la partenza.
            // in fase di scelta Popup viene aggiunta la descrizione di arrivo
            cmless600 = new L.layerGroup()
            cmmore600 = new L.layerGroup()
            ttless600 = new L.layerGroup()
            ttmore600 = new L.layerGroup()
            _allcm=new L.layerGroup()
            salite_rows.forEach(function (el, ct) {
                // no primo record e diverso da precedente o primo record
                if ((ct != 0 && el.lat2 + el.lon2 != salite_rows[ct - 1].lat2 + salite_rows[ct - 1].lon2)
                    || (ct == 0)) {
                    // creazione Circle Marker per il punto di arrivo
                    _cm = cm(el)
                    function cm(el) {
                        // impostazione colore CircleMaker
                        function getColor(d) {
                            return d > 1000 ? '#800026' :
                                d > 900 ? '#BD0026' :
                                    d > 800 ? '#E31A1C' :
                                        d > 700 ? '#FC4E2A' :
                                            d > 600 ? '#FD8D3C' :
                                                d > 500 ? '#FEB24C' :
                                                    d > 10 ? '#FED976' :
                                                        '#FFEDA0';
                        }
                        var cm = new L.CircleMarker([el.lat2, el.lon2],
                            {
                                radius: 12,
                                fillColor: getColor(el.altitude2.toString()),
                                color: "#000",
                                weight: 1,
                                opacity: 1,
                                fillOpacity: 0.8,
                                data: el,
                            });

                        return cm
                    }
                    // Creazione Tooltip per arrivo salita
                    _toolTip = toolTipSalita(el, 2)
                    function toolTipSalita(el, suffix) {
                        if (suffix == 2) {
                            tTip = L.tooltip({
                                permanent: true,
                                direction: 'rigth',
                                offset: [10, 0],
                                opacity: 0.80,
                            })
                            tTip.setContent(el.indirizzo2 + " " + el.city2 + " m." + el.altitude2)
                            tTip.setLatLng([el.lat2, el.lon2])
                        }
                        else {
                            tTip = L.tooltip({
                                permanent: true,
                                direction: 'left',
                                offset: [10, 0],
                                opacity: 0.45,
                            })
                            tTip.setContent(el.indirizzo1 + " " + el.city1 + " m." + el.altitude1)
                            tTip.setLatLng([el.lat1, el.lon1])
                        }
                        return tTip
                    }
                    if (el.altitude2 < 600) {
                        _toolTip.addTo(ttless600)
                        _cm.addTo(cmless600)
                    }
                    else {
                        _toolTip.addTo(ttmore600)
                        _cm.addTo(cmmore600)
                    }
                    _cm.addTo(_allcm)
                }
            });
            resolve([cmless600, cmmore600, ttless600, ttmore600,_allcm])
        });
    }
    return crea_layers(salite_rows)
    // ritorna 4 gruppi layers a seconda dell'altezza <>600, _allcm contiene tutti i cm
    }).then(async function ([cmless600, cmmore600, ttless600, ttmore600, _allcm]) {
    
    // impostazione mappa
    map = await initMap()
    // delimitazione area map 
    // da fit_milestones, solo per i movimenti con salita
    bounders_rows = await get_bounders()
    async function get_bounders() {
        return new Promise(function (resolve, reject) {
            pr._type = "SQL_ALL";
            pr._sql = "select * from get_bounders";
            pr._param = [];
            // reperimento dati 
            load(pr).then(function (result) {
                resolve(result)
            })
        });
    }
    // impostazione limiti mappa
    mapBounds = await impostazione_limiti_mappa(bounders_rows)
    async function impostazione_limiti_mappa(bounders_rows) {
        return new Promise(function (resolve, reject) {
            var southWest = L.latLng([bounders_rows[0].lat_min, bounders_rows[0].lon_min])
            var northEast = L.latLng([bounders_rows[0].lat_max, bounders_rows[0].lon_max])
            resolve(L.latLngBounds(southWest, northEast))
        })
    }
    // centratura con i dati medi di lat e longitudine zoom 18
    map.setView([bounders_rows[0].lat, bounders_rows[0].lon], 18);
    // limiti della mappa
    map.fitBounds(mapBounds);
    // layer della mappatura
    tileMap(map)
    // creazione della popup per l'elenco della
    // partenza leggo tutti i circle
    // nella routine è presente l'emissione della seconda
    // popup
    _allcm.eachLayer(async function (layer) {
        // viene eseguito al momento del click sul cm
        layer.on('click', async function (e) {
            // popup con i record di partenza  
            // due o più strade per arrivare al cm
            await popup_elenco_partenza(e, salite_rows)
            // generazione dell'elenco delle tratte di partenza
            // partendo dall'apertura del popup del punto di arrivo  
            async function popup_elenco_partenza(e, salite_rows) {
            // ogni cm ha nelle options i dati relativi al rec salite_rows
            // che lo ha generato, poichè non viene ripetuto, utilizzo
            el = e.target.options.data
            // creazione dati per popup di partenza
            function div_popup(el) {
                div = document.createElement("div")
                div.className = "PopupHeader"
                div.id = "PopupHeader"
                // intestazione = dati di arrivo
                div.innerHTML = el.indirizzo2 + " " + el.city2 + " m." + el.altitude2 + "<br>"
                div1 = document.createElement("div")
                // aggiungo il div che conterrà Tabella,grafico,riepilogo
                div1.id = "div1"
                // wait ..
                img = document.createElement("img")
                img.src = "bike.png"
                div1.appendChild(img)
                div.appendChild(div1)
                return div
            }
            // div è il contenitore dei dati della popup
            div = div_popup(el)
            // creo la popup per l'elenco delle salite al
            // cm richiesto
            popup_itinerario(e, el, div).openOn(map);
            function popup_itinerario(e, el) {
                // option popup
                function opt_popup(el) {
                    return {
                        interactive: true,
                        permanent: true,
                        direction: 'left',
                        data: el,
                        className: 'cssHeaderRow',
                        maxHeight: 700, minWidth: 400,
                        closeOnClick: false,
                        autoClose: false
                    }
                }
                opt = opt_popup(el)
                popup = L.popup(opt)
                    .setLatLng(e.target._latlng)
                    .setContent(div)
                // apro la popup
                return popup
            }
            // aggiungo una chart table google con i dati 
            // salite_row filtrati per punto di arrivo
            // per poter scegliere quale salita visualizzare
                salite_rows_filtered = []
                salite_rows.filter(Salita_1)           
            function Salita_1(rec) {
                if (rec.id2 == el.id2) {
                    salite_rows_filtered.push(rec)
                }
                 
            }
            // visualizzo il grafico-tabella
            google.load("visualization", "1", { packages: ["table"] });
            // Visualizzazione tabella salite per punto di arrivo
            // salite_rows_filtered
            google.charts.setOnLoadCallback(function () {
                ChartPopupItinerario(salite_rows_filtered)
                async function ChartPopupItinerario(salite_rows_filtered) {
                // definizione dati - header
                var data = new google.visualization.DataTable();
                // dati itinerario e rec completo
                data.addColumn({ type: "string", label: "Itinerario " })
                // Aggiungo le righe
                salite_rows_filtered.forEach(function (rec) {
                    data.addRow([
                        rec.indirizzo1 + " " + rec.city1 + " m." + rec.altitude1
                    ])
                })
                // div che contiene la tabella
                div=document.getElementById("div1")
                var table = new google.visualization.Table(div);
                // view della tabella
                var view = new google.visualization.DataView(data);
                // emissione tabella
                table.draw(view, dc.options);
                // evento seleziona
                // click su itinerario. Emissione popup con tabella
                // chart e riepilogo
                google.visualization.events.addListener(table, "select", await selectChartItinerario);
                // modifico la popup generata per visualizza
                // tabella,Grafico,riepilogo
                // click su salita ( 1 popup)
                async function selectChartItinerario(e) {
                    // contiene il numero di riga della selezione
                    selectedItem_Itinerario = table.getSelection()[0];
                    // contiene il rec di salite_rows da visualizzare
                    el = salite_rows_filtered[selectedItem_Itinerario.row]
                    if (el.punti == null) {
                        // creazione punti aggiornamento server in quanto il campo punti
                        // contente i tracciati per il grafico è troppo grande    
                        salite_rows = await fnc_aggiornamento_salite(el)
                        // Aggiorno quindi el che contiene la riga dei valori e dei
                        // punti per la salita
                        el = salite_rows_filtered[selectedItem_Itinerario.row]
                        function fnc_aggiornamento_salite(el) {
                            pr._type = "SQL_NODE";
                            pr._param = [el.inizio, el.fine]
                            pr.id1 = el.id1
                            pr.id2 = el.id2
                            return load(pr)
                                .then(function (result) {
                                    resolve(result)
                                })
                        }
                    }
                    // punti per la creazione del routing 
                    itinerario = JSON.parse(el.punti)                     
                    routingCreate(itinerario)
                    // tabella uscite seleziono salite_rows per tutte
                    // le uscite get_salite_table
                    async function get_salite_table_rows() {
                        return new Promise(function (resolve, reject) {
                            // Inizio e fine delle salite
                            pr._type = "SQL_ALL";
                            pr._sql = "select * from get_salite_tabella where id1=? and id2=?"
                            pr._param = [el.id1, el.id2];
                            // reperimento dati 
                            load(pr).then(function (result) {
                                salite = result                                
                                function controlla_altitudine(salite){
                                    return new Promise(function (resolve, reject) {
                                salite.forEach(async function (el) {
                                    await aggiorna_elevation_salita(el.inizio, el.fine)
                                })
                                resolve(salite)
                                })
                                }
                                // esegue la routine di controllo altitudine
                                return controlla_altitudine(salite)
                                .then(function (salite) {
                                    resolve(salite)
                                })
                            })
                        })
                    }
                    salite_table_rows = await get_salite_table_rows(el)
                    // chiamo la routine per la visualizzazione della
                    // tabella di tutte le uscite effettuate in quella salita
                    async function Chart_table_salita(el, div, salite_table_rows) {
                        return new Promise(function (resolve, reject) {
                            google.load("visualization", "1", { packages: ["table"] })
                            google.charts.setOnLoadCallback(function () { drawChart(el, div, salite_table_rows) });
                            function drawChart(el, div, data_grafico) {
                                // Nome delle colonne
                                var data = new google.visualization.DataTable();
                                data.addColumn({ type: "string", label: "Data" /*+ (await fnc_aggiorna())*/ });
                                data.addColumn({ type: "string", label: "durata" });
                                data.addColumn({ type: "string", label: "km" });
                                data.addColumn({ type: "string", label: "km/h" });
                                // dati della tabella     
                                data_grafico.forEach(function (item) {
                                data.addRow([
                                    fnc_data(item.fine, "s").substring(0, 10),
                                    fnc_totime(item.durata).toString(),
                                    (Math.round((item.km_a - item.km_da) * 100) / 100).toString(),
                                    (Math.round((item.km_a - item.km_da) / item.durata * 3600 * 100) / 100).toString(),
                                    ]);
                                });
                                // ordino per durata,quindi il piu veloce 
                                data.sort([{ column: 1 }]);
                                var view = new google.visualization.DataView(data);
                                // Visualizza
                                // Pulizia div ricevuto
                                div.innerHTML = ""
                                div.className = "PopupMilestone"
                                // creo un div per l'intestazione
                                var divIntest = document.createElement("div");
                                divIntest.id = "divIntest"
                                // Intestazione dati comuni alla salita
                                function intestazione_grafico_popup(el) {
                                    return new Promise(function (resolve, reject) {
                                        //  get_dislivello()
                                        //    .then(function (ar) {
                                        returnstring = "SALITA:" + "</br>" +
                                            el.id1 + " - " + el.indirizzo1 + " " + el.city1 + " alt. m. " + el.altitude1 + "</br>" +
                                            el.id2 + " - " + el.indirizzo2 + " " + el.city2 + " alt. m. " + el.altitude2 + "</br>" +
                                            " dislivello " + el.dislivello.toFixed(0) + "</br>" +
                                            " pendenza " + (el.pendenza * 10000000).toFixed(1) + "%"
                                        //    })
                                        resolve(returnstring)
                                    })
                                }
                                intestazione_grafico_popup(el)
                                .then(function (returnstring) {
                                    // Intestazione
                                    divIntest.innerHTML = returnstring
                                    div.appendChild(divIntest);
                                    // creo un div contenente la tabella
                                    var divcharttable = document.createElement("div");
                                    divcharttable.id = "divcharttable"
                                    div.appendChild(divcharttable);
                                    // visualizzo la tabella sul div
                                    var chart = new google.visualization.Table(divcharttable);
                                    // seleziona
                                    google.visualization.events.addListener(view, "select", async function () {
                                        var selectedItem = view.getSelection()[0];
                                        // nessuna azione in caso si selezione
                                        if (selectedItem) { }
                                    });
                                    chart.draw(view, dc.options);
                                    // ritorno il div da aggiungere alla popup
                                    resolve(div)
                                });
                            }
                        })
                    }
                    return Chart_table_salita(el, div, salite_table_rows)
                    
                    // chiamo la routine per la visualizzazione del
                    // grafico della salita ( itinerario)
                    .then(function (result) {
                        async function Chart_dislivello(itinerario, div) {
                            return new Promise(function (resolve, reject) {
                                // dati grafico
                                google.charts.load('current', { 'packages': ['corechart', 'line'] });
                                google.charts.setOnLoadCallback(function () {
                                    function drawChart(data, div) {
                                        container = document.createElement("div")
                                        container.id = "map_chart_salita"
                                        div.appendChild(container)
                                        var chart = new google.visualization.LineChart(container);

                                        data_grafico = []
                                        data_grafico.push(["KM", "ALT"])
                                        data.forEach(function (el) {
                                            data_grafico.push([el[2], el[3]])
                                        })

                                        var dataTable = google.visualization.arrayToDataTable(data_grafico);
                                        dataTable.addColumn({ type: 'string', role: 'tooltip' });
                                        for (var i = 0; i < dataTable.getNumberOfRows(); i++) {
                                            if (i != 0) {
                                                dataTable.setValue(i, 2,
                                                    " Pend. % " +

                                                    (
                                                        (dataTable.getValue(i, 1) - dataTable.getValue(i - 1, 1)) /
                                                        (dataTable.getValue(i, 0) - dataTable.getValue(i - 1, 0))
                                                    ) * 100000
                                                        .toFixed(2)
                                                )
                                            }
                                            else { dataTable.setValue(i, 2, "Inizio") }

                                        }
                                        // costruzione del grafico    
                                        var options = {
                                            hAxis: {
                                                title: "al km", gridlines: { count: itinerario.length - 1, },
                                                ticks: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
                                            },
                                            vAxis: {
                                                title: "altitudine in m.",
                                                viewWindow: { min: 0, },

                                            },
                                            title: "Sviluppo altimetrico salita",
                                            curveType: "function",
                                            legend: { position: "bottom" },
                                            height: 300,
                                        };
                                        chart.draw(dataTable, options);
                                        return div
                                    }
                                    div = drawChart(itinerario, div)
                                    resolve(div)
                                });

                            })
                            

                        }
                        return Chart_dislivello(itinerario, div)
                    })
                    .then(function (div) {
                        // ritorna il div e il ro

                        //    return fit_getPopupSalita(el)
                        //        .then(function (result) {
                        //            div = result
                        dc.ro.addTo(map)
                        //    markers.addLayer(ro)
                        Icon = L.divIcon({
                            
                            html: '<div></div>', iconSize: [0, 0],
                        });
                        m = L.marker(
                            [el.lat2, el.lon2],{icon:Icon})
                        m.bindPopup(div.innerHTML, opt)

                        m.openPopup()
                        m.addTo(map)

                        // punto per popup
                        var panedrag = map.createPane('panedrag');
                        panedrag.style.zIndex = 5000;
                        Icon = L.divIcon({
                            className: 'PopupButton',
                            html: '<div> Sposta </div>', iconSize: [70, 20],
                        });

                        m = L.marker(
                            [el.lat2, el.lon2],
                            {
                                draggable: true,
                                pane: panedrag,
                                icon: Icon
                            })
                            .addTo(map)
                            .on('dragend', function (e) {
                                map.closePopup();
                                // add popup information on dragged marker
                                m.bindPopup(div.innerHTML, opt)
                                m.openPopup()
                            });

                        map.addLayer(m)
                    })                    
                }
                } 
            }) // call back 1 popup itinerario;
            } // function popup_elenco_partenza
        }) // click su cm punto di arrivo
    }) // each layer
    // gestione layer.control 
    layer_control_salite(map)
    function layer_control_salite(map) {
        // Aggiungo alla map i layers >600
        cmmore600.addTo(map)
        ttmore600.addTo(map)
        var baseMaps = {};
        var overlayMaps = {
            "<600": cmless600,
            ">600": cmmore600,
        };
        var layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
        map.on('overlayadd', function (event) {
            if (event.name == "<600") {
                ttless600.addTo(map)
            }
            if (event.name == ">600") {
                ttmore600.addTo(map)
            }
        });
        map.on('overlayremove', function (event) {
            if (event.name == "<600") {
                map.removeLayer(ttless600)
            }
            if (event.name == ">600") {
                map.removeLayer(ttmore600)
            }
        });
    };
    // elaborazione layersGroup    
    })
}
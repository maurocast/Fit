//
// Visualizzazione Salite da menu
//

// Visualizzazione delle salite
// come da tabella fit_salite ( da.. a.. )
async function get_milestones() {
    // visualizzazione div
    hidden_div(["map_table_charts", "map_table","div_riepilogo"], ["div_visualizzazione"], []);
    // delimitazione area map 
    // da fit_itinerario, solo per i movimenti con salita
    get_bounders()
    // reperimento dati 
    bounders_rows = await load(pr)
    // impostazione limiti mappa
    var southWest = L.latLng([bounders_rows[0].lat_min, bounders_rows[0].lon_min]),
        northEast = L.latLng([bounders_rows[0].lat_max, bounders_rows[0].lon_max]),
        mapBounds = L.latLngBounds(southWest, northEast);
    // impostazione mappa
    // elimino eventuali controlli già presenti
    removeContainerFromMap('map_div')
    var map = new L.map("map_div")
    // pulizia eventuali layers ( in caso di aggiornamento )
    removeLayersFromMap(map)
    // centratura
    // con i dati medi di lat e longitudine
    map.setView([bounders_rows[0].lat, bounders_rows[0].lon], 22);
    // limiti della mappa
    map.fitBounds(mapBounds);
    // layer
    tileMap(map)
    // select salite e milestone 
    // visualizzazione solo salite con arrivo quota maggiore di 700
    get_salite()
    // Impostazione database
    load(pr)
        // creazione oggetti map 
        .then(function (salite_rows) {
            dc.salite_rows=salite_rows
            crea_layers(salite_rows, map)
        })
}
// creazione dei circle Marker e Tooltip
async function crea_layers(salite_rows, map) {
    return new Promise(function (resolve, reject) {
        // salite_rows ordinato per lat e lng finali per evitare di
        // caricare due volte la stessa fine salita
        // carica solo la partenza.
        // in fase di scelta Popup viene aggiunta la descrizione di arrivo
        salite_rows.forEach(function (el, ct) {
            // no primo record e diverso da precedente o primo record
            if ((ct != 0 && el.lat2 + el.lon2 != salite_rows[ct - 1].lat2 + salite_rows[ct - 1].lon2)
                || (ct==0))
            {
                // cm
                _cm = cm(el) 
                // tooltip
                filtered = []
                filtered = salite_rows.filter(function (rec) {
                    return rec.id2 == el.id2
                })
                filtered.forEach(function (el) {
                    toolTipSalita(el, 1, map)
                })
                // Arrivo
                toolTipSalita(el, 2, map)

                // event popup
                _cm.on('click', function (e) {
                    dc.target=e.target
                    // popup 
                    get_pop(e.target, e.target.options.data, dc.salite_rows, map)       
                    })
                _cm.addTo(map)
            }
        });       
        resolve("Ok")
    });
}
// funzione di caricamento della popup
// scrittura del innerHTML di div
// input elemento e map
function visualizzaPopupSalita() {
    return new Promise(function (resolve, reject) {
        // dati comuni
        el = dc.el
        map=dc.map
        // Imposto sulla tabella riepilogo altitudine partenza e arrivo
        document.getElementById("Partenza_m").innerHTML = el.altitude1
        document.getElementById("Arrivo_m").innerHTML = el.altitude2
        // contenitore della tabella - Popup
        div = document.createElement("div")
        // dati per popup da itinerario
        // seleziono i dati di itinerario
        pr._type = "SQL_ALL"
        pr._sql = "select da.data,da.mil_da,da.inizio,da.km_da," +
            " a.mil_a, a.fine, a.km_a, Cast((  JulianDay(a.fine) - JulianDay(da.inizio)" +
            ") * 24 * 60 * 60 As Integer) as durata from fit_itinerario as da " +
            " inner join fit_itinerario as a on da.data = a.data " +
            " where   da.mil_da = ? and a.mil_a = ? and da.inizio < a.fine"
        pr._param = [el.id1, el.id2];
        load(pr)
            // elaborazione
            .then(function (result) {
                // dati della tabella
                dc.dati_grafico = result
                // eseguo l'aggiornamento della elevation
                // solo la prima volta
                // sui dati grafico
                inizio = dc.dati_grafico[0].inizio
                fine = dc.dati_grafico[0].fine
                aggiorna_elevation_salita(inizio,fine)
                    .then(function () {
                        pr._type = "SQL_ALL"
                        pr._sql =
                            "select f.position_lat,f.position_long,e.elevation,f.distance," +
                            " e.elevation -   LAG(e.elevation, 1) OVER(ORDER BY timestamp_key) AS dislivello " +
                            "  from fit as f " +
                            "  left join fit_elevation AS e ON f.position_lat = e.position_lat AND " +
                            " f.position_long = e.position_long " +
                            " where timestamp_key>? and timestamp_key<? "
                        pr._param = [result[0].inizio, result[0].fine];
                        load(pr)
                            .then(function (result) {
                                // dislivello
                                dislivello = 0
                                // maxpendenza
                                maxpendenza = 0
                                // distanza
                                distanza = 0
                                // imposto la '  array bidimensionale
                                ar = [["km", "Altitudine"]];
                                result.forEach(function (el) {
                                    function calcolaRiepilogo(el) {
                                        // sommo i dislivelli positivi
                                        if (el.dislivello > 0) {
                                            dislivello += el.dislivello
                                        }
                                        distanza = el.distance - result[0].distance
                                        gained = el.elevation - result[0].elevation
                                        gainedString = gained / distanza * 100
                                        if (maxpendenza < gainedString) {
                                            maxpendenza = gainedString
                                        }
                                        ar.push([distanza, dislivello])
                                    }
                                    calcolaRiepilogo(el)
                                })
                                // dislivello distanza pemdenza max
                                document.getElementById("Dislivello_m").innerHTML = dislivello.toFixed(0)
                                document.getElementById("distanzakm").innerHTML = (distanza / 1000).toFixed(1)
                                document.getElementById("Pendenza_max").innerHTML = maxpendenza.toFixed(1) + " % "
                                // latLng dei punti
                                itinerario = []
                                // aggiunge Tooltip ogni x punti
                                function TooltipOnRoute(result, ct, lt, map) {
                                    L.tooltip({
                                        permanent: true,
                                        direction: 'rigth',
                                        offset: [10, 0],
                                        opacity: 0.80,
                                    })
                                        .setContent(result[ct].elevation.toFixed(0) + " m.")
                                        .setLatLng(lt)
                                        .addTo(map)
                                }
                                // Centra e aggiunge dislivello
                                function TooltipOnRouteDislivello(result, ct, lt, map) {
                                    // se ct - del passo 
                                    if (ct > Math.round(result.length / 10)) {
                                        dist = result[ct].distance -
                                            result[ct - Math.round(result.length / 10)].distance
                                        gained = result[ct].elevation -
                                            result[ct - Math.round(result.length / 10)].elevation
                                        ltdist = L.latLng(
                                            result[ct - Math.round(result.length / 10)].position_lat,
                                            result[ct - Math.round(result.length / 10)].position_long)
                                        gainedString = (gained / dist * 100).toFixed(2) + " % "
                                    }
                                    else {
                                        dist = 0
                                        gained = 0
                                        ltdist = L.latLng(
                                            result[ct].position_lat,
                                            result[ct].position_long)
                                        gainedString = "0 % "
                                    }
                                    L.tooltip({
                                        permanent: true,
                                        direction: 'left',
                                        offset: [0, 0],
                                        opacity: 0.80,
                                        className: 'class-tooltip'
                                    })
                                        .setContent(gainedString)
                                        .setLatLng(ltdist)
                                        .addTo(map)
                                }
                                ct = 0
                                // lettura fit della salita                            
                                while (ct < result.length-1) {
                                    // latlng
                                    lt = L.latLng(result[ct].position_lat, result[ct].position_long)
                                    itinerario.push(lt)
                                    // non il primo record
                                    if (ct > 0) {
                                        TooltipOnRoute(result, ct, lt, map)
                                        TooltipOnRouteDislivello(result, ct, lt, map)
                                    }
                                    // 5 punti
                                    ct += Math.round(result.length / 5)
                                    if (ct > result.length - 1)
                                        {ct=result.length-1}
                                }
                                // aggiunge l'ultimo record
                                ct = result.length - 1
                                lt = L.latLng(result[ct].position_lat, result[ct].position_long)
                                itinerario.push(lt)
                                // creazione routing
                                function routingCreate(itinerario) {
                                    var ro = L.Routing.control({
                                        waypoints: itinerario,
                                        show: false,
                                        createMarker: function () { return null; }
                                    })
                                    ro.addTo(map)
                                    // per non visualizzare gli itinerari testo
                                    const cont = document.querySelectorAll('.leaflet-control-container');
                                    cont.forEach(function (el) {
                                        el.style.display = 'none';
                                    });

                                }
                                TooltipOnRouteDislivello(result, ct, lt, map,)
                                routingCreate(itinerario)
                                // tabella grafico salita
                                Chart_dislivello(ar)
                                // visualizzo la tabella
                                // impostazioni google charts
                                google.load("visualization", "1", { packages: ["table"] });
                                google.charts.setOnLoadCallback(function () {
                                    Chart_table_salita(el, div, dc.dati_grafico)
                                        .then(function (div) {
                                            resolve(div)
                                        });
                                })
                            })
                    })
            })
    })
}
// circle marker, solo per la destinazione di arrivo.
function cm(el) {
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
function pop() {
    var customOptions = { draggable: true, maxHeight: 700, minWidth: 400 }
 
    // generazione della popup per la salita
    visualizzaPopupSalita()
        .then(function (div) {
           
            // aggiungo il grafico
            hidden_div([],[],["div_riepilogo"])
            div_grafico=document.getElementById("map_chart_salita")
            div.appendChild(div_grafico)
            div_riepilogo = document.getElementById("div_riepilogo")
            div_r=div_riepilogo
            div.appendChild(div_r)

            dc.target.bindPopup(div.innerHTML, customOptions)
            dc.divinnerHTML = div.innerHTML
            dc.target.openPopup()

            // punto per popup
            var panedrag = map.createPane('panedrag');
            panedrag.style.zIndex = 5000;
            newMarker = L.marker([dc.target._latlng.lat, dc.target._latlng.lng],
                {
                    draggable: true,
                    pane: panedrag
                })
                .addTo(dc.map)
                .on('dragend', function (e) {

                    // add popup information on dragged marker
                    newMarker.bindPopup(dc.divinnerHTML, customOptions)
                    newMarker.openPopup()
        
                });
        })
}
// popup e tooltip su fine e inizio
function get_pop(_cm, el, salite_rows, map)
{
    // Partenza
    filtered=[]
    filtered = salite_rows.filter(function (rec) {
        return rec.id2==el.id2
    })
    // option popup
    opt = {
        interactive: true,
        permanent: true,
        direction: 'left',
        data: el,
        className: 'cssHeaderRow', // name custom popup
        maxHeight: 700, minWidth: 400
    }
    string = '<div class="PopupHeader">' + el.indirizzo2 + " " + el.city2 + " m." + el.altitude2 + '</div>' 
    filtered.forEach(function (el) {
        dc.map = map
        dc.el=el
        string += '<button class="PopupButton" onclick="pop()">' +
            el.indirizzo1 + " " + el.city1 + " m." + el.altitude1 + '</button>'
    })
    string +='<div id="map_chart_salita"></div>'
    _cm.bindPopup(string, opt)
    _cm.openPopup()
}
// routing
function ro(el) {
    var ro = L.Routing.control({
        waypoints: [
            L.latLng(el.lat1, el.lon1),
            L.latLng(el.lat2, el.lon2)
        ],
        show: false,
        createMarker: function () { return null; }
    })
    return ro
}

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
// elaboro i dati relativi alla tratta selezionata
async function aggiorna_elevation_salita(inizio,fine) {
   
    // routine di selezione dei movimenti dal file fit
    // solo i movimenti che non hanno elevation
    pr._type = "SQL_ALL";
    pr._sql = "SELECT f.position_lat , f.position_long FROM fit AS f" +
        " LEFT JOIN fit_elevation AS e ON f.position_lat = e.position_lat AND " +
        " f.position_long = e.position_long where f.timestamp_key between ? and ? " +
        " and e.elevation is null or e.elevation =0"
    pr._param = [inizio, fine];
    // contiene il campo latlng e scrivo il campo pr._param.
    // la function load lo passa al server
    result = await load(pr)

    if (result.length > 0) {
        //genero array tratta contenente il km e l'elevation
        ct = 0;
        len = result.length
        pr._param = ""
        while (ct < len) {
            pr._param += result[ct].position_lat + "," + result[ct].position_long + "§"
            ct += 1
async function findAndWriteElevation(pr)
                {
                // devo attendere 1 secondo sul server
                await delay(1000)
                pr._type = "REQUEST";
                result_e = await load(pr);
                pr._param = []
                result_e.results.forEach(function (i, cx) {
                    pr._param.push([checkElevation(i.elevation, cx, pr._param), i.location.lat, i.location.lng])
                })
                pr._sql =
                    "Replace into fit_elevation(elevation,position_lat,position_long) values(?,?,?)";
                pr._type = "SQL_RUN"
                await load(pr)
                    pr._param = ""
}
            // divisibile per 99
            if (ct % 99 === 0 || ct == len) {
                await findAndWriteElevation(pr)}      
        }
        // fine lettura
        if (ct < len) {
            await findAndWriteElevation(pr)}
    }
}
// definizione bounders
function get_bounders() {
    pr._type = "SQL_ALL";
    pr._sql = "select * from get_bounders";
    pr._param = [];
}
function get_salite() {
    // Inizio e fine delle salite
    pr._type = "SQL_ALL";
    pr._sql = "select * from get_salite where altitude2>700"
    pr._param = [];
}
// Routine di impostazione dei layer della map Leaflet
// per la visualizzazione dell'uscita.
// riceve come parametro map e lo aggiorna
async function get_layers_uscita(map) {
  // riga selezionata:
  // dc.data_grafico_testata contiene i valori del file fit_tes
  
  // visualizzo il div per oscurare la mappa durante la fase di caricamento
  // non visualizzo il menu
  hidden_div([ "div_menu1"], ["div_visualizzazione"], []);
  // esecuzione delle due routine asyncrone per velocizzare
  // punti del tragitto per polylyne
  pr._type = "SQL_ALL";
  pr._sql = "select * from get_fit where data = ?";
  pr._param = dc.data_grafico_testata[dc.selectedItem_testata.row].data;
  load(pr)
    // scrive polyline del tragitto
    // il popup su un punto apre la richiesta di nuovo milestone
    .then(function (result) {
      get_polyline(result, map)
    })
  // milestones uscita
  pr._type = "SQL_ALL";
  pr._sql = "select * from get_fit_itinerario where data=?";
  pr._param = [[dc.data_grafico_testata[dc.selectedItem_testata.row].data]];
  load(pr)
    .then(function (result) {
      // creo i cm e i tooltip
      // se click sul cm, crea i dati per la popup
      result.forEach(function (el) {
        get_milestone(el, map);
      })
    })
  // impostazione limiti mappa
  // delimitazione area map
  bounders_rows = dc.data_grafico_testata[dc.selectedItem_testata.row]
  // impostazione limiti mappa
  var southWest = L.latLng([bounders_rows.lat_min, bounders_rows.lon_min]),
    northEast = L.latLng([bounders_rows.lat_max, bounders_rows.lon_max]),
    mapBounds = L.latLngBounds(southWest, northEast).pad(1);
  // impostazione mappa personalizzata per singola testata
  map.setView([bounders_rows.lat, bounders_rows.lon], 22);
  // limiti
  map.fitBounds(mapBounds);
  tileMap(map)
  //   
}
// milestones
// Gestione milestones per uscita con creazione maker  
async function get_milestone(el, map) {
  // tooltip
  // contiene il codice , la descrizione e l'elevation del milestone
  var pane1 = map.createPane('pane1');
  pane1.style.zIndex = 3000;
  L.tooltip({
    pane: 'pane1',
    permanent: true,
    direction: 'rigth',
    offset: [10, 0],
    opacity: 0.45,
  })
    .setContent(el.indirizzo_a + " " + el.altitude + "m.")
    .setLatLng([el.position_lat, el.position_long])
    // aggiungo il tip
    .addTo(map)
  // Circle 
  cm = new L.CircleMarker([el.position_lat, el.position_long],
    { pane: 'pane1', "mil_a": el.mil_a, })
    // aggiungo i cm alla map
    .addTo(map)
    // creo la tabella google Chart per ogni mil_a 
    // popup 
    .on("click", function (e) {
      // latlng dove aprire la popup ( da cm )
      latlng = e.latlng
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
            // dati popup
            dc.data_grafico_mil_popup = result
            // creo il grafico Popup e il div contenitore
            Chart_popup()
              .then(function (result) {
                popup = L.popup({
                  pane: "pane1",
                  closeOnClick: false,
                  autoClose: false,
                  maxWidth: "auto"
                })
                // aggiungo il div contenitore
                  .setContent(result.innerHTML)
                // latlng
                  .setLatLng(latlng)
                // visualizzo
                .openOn(map)
              });
          })
      })
    });
} 
// seleziono la map dal popup milestone 
function get_map_da_popup(datauscita) {
  // tabella dettaglio e grafici
  // impostazioni map per verificare se esiste,in questo caso darebbe errore 
  removeContainerFromMap('map_div')
  var map = new L.map("map_div")
  removeLayersFromMap(map)
  // visualizzazione mappa leaflet
  selectedItem_testata = datauscita.toString().substring(0, 4) + "-" +
    datauscita.toString().substring(4, 6) + "-" + datauscita.toString().substring(6, 8)
  dc.data_grafico_testata.forEach(function (i, ct) {
    if (i.data == selectedItem_testata) { dc.selectedItem_testata.row = ct }
  })
  get_layers_uscita(map);
}
//
// crea il polyline dell'intero tracciato
// index=3000
function get_polyline1(latlng, map) {
  var pane1 = map.createPane('pane1');
  pane1.style.zIndex = 3000;
  var pol = new L.polyline(latlng, { pane: 'pane1', color: "red", })
  .addTo(map)
  // se click sul polyline imposta la popup della creazione del
  // milestone
  // e contiene il punto esatto su cui è stato fatto il click
  pol.on('click', function (e) {
    popup = L.popup({
      closeOnClick: false,
      autoClose: false
    })
      .setLatLng(e.latlng)
    // content popup
    // impostazione valori label Coordinate
    document.getElementById("lblCoordinate").innerHTML = "Coordinate: " +
      e.latlng.lat.toFixed(5) + ", " + e.latlng.lng.toFixed(5)
    // impostazione routine di scrittura dei dati
    document.getElementById("buttonNuovoMilestone").addEventListener("click", function () {
      // click sul button crea Milestone 
      get_milestone_nuovo_da_popup(e.latlng.lat, e.latlng.lng)
    })
    // visualizzo il div
    hidden_div([], ["div_popupMilestone"], []);
    popup.setContent(document.getElementById("div_popupMilestone"))
    // apro la popup
    popup.openOn(map);
  });
}


// Routine di impostazione dei layer della map Leaflet
// per la visualizzazione dell'uscita.
// viene visualizzato il moving e aggiornato l'itinerario
// al raggiungimento del punto

 
// riceve come parametro map e lo aggiorna

// milestones
// Gestione milestones per uscita con creazione maker  

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
    fitget_layers_uscita(map);
}

// creo marker per l'inizio e lo visualizzo
// sulla map

function milestone_home(result, map) {
    var myIcon = L.divIcon({
        html: '<div class="home-icon">Start</div>'
    });
    m = new L.Marker([result[0].lat_home, result[0].lon_home],
        { icon: myIcon })
    m.addTo(map)
}
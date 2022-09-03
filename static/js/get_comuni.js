// Routine di uso comune

// trasformazione data.
// tipo='d' ritorna una campo data
// tipo='s' ritorna una stringa nel formato GG/MM/AAAA
function fnc_data(datain, tipo) {

    d = new Date(
        datain.substring(0, 4), datain.substring(5, 7) - 1, datain.substring(8, 10)
    );
    month = '' + (d.getMonth() + 1)
    day = '' + d.getDate()
    year = d.getFullYear()
    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;
    if (tipo == "s") {
        return [day, month, year].join('/');
    }
    else {
        return d
    }
}
// trasforma millesimi di secondo in hh:mm:ss di tipo String
function fnc_totime(durata) {
    hh = Math.floor(durata / 3600)
    durata -= (hh * 3600)
    mm = Math.floor(durata / 60)
    durata -= mm * 60;
    ss = (100 + durata).toString().substring(1)
    mm = (100 + mm).toString().substring(1)

    if (hh == 0) { return mm.toString() + ":" + ss.toString(); }
    else {
        return hh.toString() + ":" + mm.toString() + ":" + ss.toString();
    }
}
// remove layers from map per inizializzazione
function removeLayersFromMap(map) {
    map.eachLayer(function (layer) {
        map.removeLayer(layer);
    });
}
// remove dal container per inizializzazione
function removeContainerFromMap(div) {
    var container = L.DomUtil.get(div);
    if (container != null) {
        container._leaflet_id = null;
    }
}
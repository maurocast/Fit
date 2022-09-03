// Creazione CircleMarker
// record - contiene gli elementi del record selezionato
// lat,lon,altitude .


function overlap(rect1, rect2) {
    return !(rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom);
}

function hideOverlappingTooltips() {
    var rects = [];
    var tooltips = document.getElementsByClassName('myTooltip');
    var tooltipsp = document.getElementsByClassName('myTooltipp');

    for (var i = 0; i < tooltips.length; i++) {
        tooltips[i].style.visibility = '';
        rects[i] = tooltips[i].getBoundingClientRect();
    }
    for (var i = 0; i < tooltips.length; i++) {
    //    if (tooltips[i].style.visibility != 'hidden') {
            for (var j = i + 1; j < tooltipsp.length; j++) {
                if (overlap(rects[i], tooltipsp[j].getBoundingClientRect()))
                {
                   tooltipsp[j].style.visibility = 'hidden';
                }
            }
        //}
    }
}
// Creazione Tooltip per salite
// 1 = Partenza a sinistra
// 2 = Arrivo   a destra

// calcola la media dele precedenti 5 elevation
function elev(elevation, rowNumber) {
    if (rowNumber > 4) {
        tot = 0
        i = rowNumber - 5
        while (i < rowNumber) {
            tot += rowFit[i].elevation
            i += 1
        }
        elevation = tot / 5
    }
    else
        {elevation = rowFit[0]}
    return elevation
}
// creazione routing
function routingCreate(itinerario) {
    itin=[]
    itinerario.forEach(function (el) {
      itin.push(L.latLng(el[0],el[1]))  
    })
    dc.ro = L.Routing.control({
        waypoints: itin,
        show: false,
        createMarker: function () { return null; }
    })
    
}
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
async function initMap()
{
     
        removeContainerFromMap('map_div')
        var map = new L.map("map_div")
        // pulizia eventuali layers ( in caso di aggiornamento )
        removeLayersFromMap(map)
        return map
}
// remove layers from map per inizializzazione
async function removeLayersFromMap(map) {
    map.eachLayer(function (layer) {
        map.removeLayer(layer);
    });
}
// remove dal container per inizializzazione
async function removeContainerFromMap(div) {
    var container = L.DomUtil.get(div);
    if (container != null) {
        container._leaflet_id = null;
    }
}
// rende gli elementi con opacita 20% se overlap
/**
function hideOverlappingPopup(layer,marker1) {
    var el = document.getElementsByClassName('circle-icon'); 
    // solo l'ultimo che corrisponde al layer
    for (Nuovo in el)
        {
    Nuovo = el[el.length - 1].getBoundingClientRect();
    marker1.pause()
        // ciclo sugli el -1 perche l'ultimo è Nuovo
        X = 220
        Y = 0
        for (var j = 0; j < el.length-1; j++) {
           
                Vecchio = el[j].getBoundingClientRect()
                
                over = overlap(Nuovo, Vecchio)
                // nuovo collide con un altro
           
            while (over) {
                X += 5
                Y+=5   
                var myIcon = L.divIcon({
                    html: layer.options.icon.options.html,
                    iconAnchor: [X, Y]
                });
                layer.setIcon(myIcon);
                elp = document.getElementsByClassName('circle-icon'); 
                Nuovo = elp[elp.length - 1].getBoundingClientRect();
                over = overlap(Nuovo, Vecchio)
                s=over
            } 
           
    }
    marker1.resume()
    }
}
 */
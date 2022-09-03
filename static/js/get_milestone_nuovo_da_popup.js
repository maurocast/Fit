async function get_milestone_nuovo_da_popup(lat, lng) {
    // effettuo la request sul server per reperire l'altitudine
    // del punto sul quale viene creto il milestone
    pr._type = "REQUEST";
    pr._param = lat + "," + lng + "§"
    load(pr)
        .then(function (result) {
            if (result.status != 'INVALID_REQUEST')
                {
            altitude = Math.round(result.results[0].elevation)
            } 
            else
            { altitude = 0}
            pr._type = "SQL_RUN";
            pr._sql = "insert into fit_milestone (lat,lon,indirizzo,city,radius,altitude) " +
                " values(?,?,?,?,?,?)"
            // passo nei parametri i dati per il nuovo milestone
            pr._param = [[lat, lng, document.getElementById("indirizzo").value,
                document.getElementById("city").value, document.getElementById("radius").value, altitude]]
            load(pr).then(function (result) {
                // milestone inserito
                map.closePopup();
            })
        })
} 
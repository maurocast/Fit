// elaboro i dati relativi alla tratta selezionata
// inizio e fine contiene i due limiti di timestamp_key
async function aggiorna_elevation_salita(inizio, fine) {
    return new Promise(function (resolve, reject) {
        // routine di selezione dei movimenti dal file fit
        // solo i movimenti che non hanno elevation
        pr._type = "SQL_ALL";
        pr._sql = "SELECT f.position_lat , f.position_long FROM fit AS f" +
            " LEFT JOIN fit_elevation AS e ON f.position_lat = e.position_lat AND " +
            " f.position_long = e.position_long where f.timestamp_key between ? and ? " +
            " and e.elevation is null "
        pr._param = [inizio, fine];
        // richiesta verver
        load(pr).then(async function (result) {
            // se selezionato almeno un record
            if (result.length > 0) {
                //genero stringa tratta contenente lat e lon e '|' da passare a API
                pr._param = ""
                // array di pr._param
                richieste = []
                result.forEach(function (el, ct) {
                    pr._param += el.position_lat + "," + el.position_long + "|"
                    // divisibile per 99 incremento array pr._richieste
                    if (ct % 99 === 0) {
                        richieste.push(pr._param)
                        pr._param = ""
                    }
                })
                // ultimo giro
                richieste.push(pr._param)
                // esecuzione elevation
                for (var ct = 0; ct <= richieste.length - 1; ct++) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await findAndWriteElevation(richieste[ct])
                }
               
            }
            resolve("ok")
        })
    })
}
// recupero elevation da API e scrittura sul file fit_elevation
async function findAndWriteElevation(param) {
    return new Promise(function (resolve, reject) {

        pr._type = "REQUEST";
        pr._param = param
        load(pr).then(function (result) {
            pr._param = []
            ar = result.results
            ar.forEach(function (i, cx) {
                if (cx > 0 && (ar[cx] != ar[cx - 1]) || cx == 0) {
                    pr._param.push([checkElevation(i.elevation, cx, pr._param), i.location.lat, i.location.lng])
                }
            })
            pr._sql =
                "Replace into fit_elevation(elevation,position_lat,position_long) values(?,?,?)";
            pr._type = "SQL_RUN"
            load(pr).then(function () {
                pr._param = ""
                resolve("ok")
            })
        })
    })
}
// controllo validita elevation, se non esiste prende la precedente
function checkElevation(ielevation, cx, pr_param) {
    if (ielevation == null || ielevation == 0) {
        if (cx > 0) {
            ielevation = pr_param[cx - 1][0]
        }
        else {
            ielevation = 0
        }
    }
    return ielevation
}

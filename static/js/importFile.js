var _sql = require("./get_sql");
var _fs = require("./get_fs");
const FitParser = require("fit-file-parser").default;


module.exports = { importFile };
// Main
async function importFile(pr) {
    return new Promise(function (resolve, reject) {

        // Viene effettuata la lettura del file ricevuto come parametro
        // se il file non è di tipo binario viene indicato il tipo di file
        // in caso di errore la funzione termina perchè non viene eseguita
        // la successiva then

        // chiamata iniziale alla prima Promise
        _fs.fnc_readFile(pr)
            // ritorna il buffer del file
            .then(function (result) {
                // lettura dati ricevuti dal Buffer, parse del file per ottenere un oggento
                // contenente un array di records                     
                pr._param = result;
                // esegue la funzione
                return to_row(pr)
            }) // scrivo il file sul database tabella
            .then(function (result) {
                pr._rows = result
                // data del file
                pr._data = result[0][0].substring(0, 10);
                // cancellazione records
                pr._sql = "delete from fit where substr(timestamp_key,1,10)=?";
                // 
                return _sql.fncRUN(pr._sql, pr._data)
            })
            .then(function (result) {

                // scrittura su database
                pr._sql =
                    "INSERT INTO fit (timestamp_key,distance,position_lat,position_long,mil) " +
                    "VALUES(?,?,?,?,?)";
                pr._param = pr._rows;
                return _sql.fncRUN(pr._sql, pr._param);
            })
            .then(function (result) {

                // Cancellazione del file di fit_tes
                pr._sql =
                    "DELETE from fit_tes where data=?"
                pr._param = pr._rows;
                return _sql.fncRUN(pr._sql, pr._data);
            })

            .then(function (result) {

                // scrittura su database
                pr._sql =
                    "insert INTO fit_tes (data,file,lat,lon,lat_min,lon_min,lat_max,lon_max,tragitto)" +
                    " SELECT  '" +
                    pr._data +
                    "','" +
                    pr._filename +
                    "',lat,lon,lat_min,lon_min,lat_max,lon_max,'' FROM   fit_latlon " +
                    " where data=?";
                return _sql.fncRUN(pr._sql, pr._data);
            }) // milestones
            .then(function (result) {
                return scrivi_fit_milestones(pr);
            })
            .then(function (result) {
                pr = result
                console.log(new Date().toISOString() + " Inseriti n. " + pr._param.length + " punti di milestones")
                pr._sql = "SELECT * from fit_itinerario_calculate" + " where data=? order by inizio";
                pr._param = pr._data;
                return _sql.fncSQL(pr._sql, pr._param);
            })
            .then(function (result) {
                //console.log(result);
                pr._rows = result
                pr._sql = "delete from fit_itinerario where data=?"
                pr._param = pr._data;
                return _sql.fncRUN(pr._sql, pr._param);
            }).then(function (result) {
                //console.log(result);
                // scrittura nuovi records
                pr._param = []
                pr._sql =
                    "Insert  INTO fit_itinerario (" +
                    "data,mil_da,mil_a,inizio,fine,km_da,km_a,durata,Km_h,Tp" +
                    ") values (?,?,?,?,?,?,?,?,?,?)";
                len=pr._rows.length
                pr._rows.forEach(function (i, ct) {
                    if (ct < len - 1 && i.km_da != pr._rows[ct + 1].km_da ) {
                        pr._param.push(Object.values(
                            [
                                i.data,
                                i.mil_da,
                                (i.mil_a = pr._rows[ct + 1].mil_da),
                                i.inizio,
                                (i.fine = pr._rows[ct + 1].inizio),
                                i.km_da,
                                (i.km_a = pr._rows[ct + 1].km_da),
                                (i.durata = (new Date(i.fine) - new Date(i.inizio)) / 1000),
                                (i.Km_h = (((i.km_a - i.km_da) * 1000) / i.durata) * 3.6),
                                (i.Tp = ""),
                            ]
                        ));
                    }
                })
                return _sql.fncRUN(pr._sql, pr._param);
            }).then(function (result) {
                pr._param = pr._data;
                pr._sql = "SELECT * from fit_itinerario_w where data=? order by inizio ";
                return _sql.fncSQL(pr._sql, pr._param);

            }).then(function (result) {
                //console.log(result);
                pr._rows = result
                // scrittura nuovi records
                pr._param = []
                let tragitto = "";
                pr._rows.forEach(function (i) {
                    tragitto += i.indirizzo_a + "-";
                });
                pr._sql =
                    "update fit_tes set tragitto = '" +
                    tragitto +
                    "' where data='" +
                    pr._data +
                    "'";
                return _sql.fncRUN(pr._sql, pr._param);
            })// dati finali della promise
            .then(function (result) {
                //console.log(result);
                resolve(result)

            })
            .catch(function (errorString) { console.log(errorString) })
            .finally(function () {
                console.log('fine');
            });
    });
}
function get_timestamp_key(dat) {
    return (timestamp_key = new Date(dat)
        .toISOString()
        .replace("T", " ")
        .replace(".000Z", ""));
}
// distanza fra due punti
function distance(lat1, lon1, lat2, lon2, unit) {
    if (lat1 == lat2 && lon1 == lon2) {
        return 0;
    } else {
        var radlat1 = (Math.PI * lat1) / 180;
        var radlat2 = (Math.PI * lat2) / 180;
        var theta = lon1 - lon2;
        var radtheta = (Math.PI * theta) / 180;
        var dist =
            Math.sin(radlat1) * Math.sin(radlat2) +
            Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = (dist * 180) / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit == "K") {
            dist = dist * 1.609344;
        }
        if (unit == "N") {
            dist = dist * 0.8684;
        }
        return dist;
    }
}
// parse file e restituzione rows
function to_row(pr) {
    return new Promise(function (resolve, reject) {
        var fitParser = new FitParser({
            force: true,
            speedUnit: "km/h",
            lengthUnit: "km",
            temperatureUnit: "kelvin",
            elapsedRecordField: true,
            mode: "both",
        });
        // Parse your file
        fitParser.parse(pr._param, function (error, result) {
            if (error) {
                Error = "File " + pr._filename + "non convertito da bin. " + "/n" + error
                console.log(Error),
                    reject(Error);
            } else {
                console.log(
                    new Date().toISOString() +
                    " Fase  2 - Eseguita conversione: " +
                    pr._filename +
                    " records: " +
                    result.records.length);
                result = scrivi(result)
                resolve(result)
            }
        })

    })
}
function scrivi(result) {

    var count = 0;
    var tempo_tot = 0;
    var elevation = 0;
    var distance_relativa = 0;
    var tempo = 0;
    var velocita = 0;
    // tipi rec validi con distance>0
    const filtered = result.records.filter(function (rec) {
        return rec.position_lat != undefined && rec.distance > 0;
    });
    len = filtered.length;
    if (len > 0)
        {
    dataIniziale = get_timestamp_key(filtered[0].timestamp).substring(0, 10)
   
    var result = [];
    while (count < len) {
        {
            i = filtered[count];
            if (count > 0) {
                distance_relativa = (
                    (-filtered[count - 1][1] + i.distance) *
                    1000
                ).toFixed(2);
                tempo =
                    (-Date.parse(filtered[count - 1][0]) + Date.parse(i.timestamp)) /
                    1000;
                tempo_tot += tempo;
                velocita = ((distance_fit * 3.6) / tempo_tot).toFixed(1);
            }
            distance_fit = Math.trunc(i.distance * 1000);

            result.push([
                get_timestamp_key(i.timestamp), // timestamp_key
                distance_fit, // distance
                i.position_lat.toFixed(5), //position_lat
                i.position_long.toFixed(5), //position_long
                0, //mil
            //    distance_relativa, // ;distance_relativa
            //    tempo, // tempo
            //    velocita, // as velocita
            //    elevation, // elevation ( Non impostata)
            ]);
        }
        count++;
    }
    }
    if (result.length > 0)
    {
        // solo le date del giorno
        const filteredDate = result.filter(function (rec) {
            return (rec[0]).substring(0, 10) == dataIniziale;
        });
        result = filteredDate
    }
   
    if (len == 0) {
        Error = new Date().toISOString() + "File non convertito " + "/n" + "",
            console.log(Error)
        result = 0
    }
    return result
}
function scrivi_fit_milestones(pr) {
    return new Promise(function (resolve, reject) {
        // estraggo un Cross con i dati dei milestones nell'area dell'uscita e i dati
        // dell'uscita stessa.
        // Per ogni punto verifico se la distanza tra i due punti è minore di 50

        pr._sql =
            "SELECT m.id,m.lat,m.lon,m.radius,f.timestamp_key,f.position_lat," +
            " f.position_long " +
            " FROM fit_milestone_calculate AS m " +
            " CROSS JOIN " +
            "  fit AS f " +
        " where substr(f.timestamp_key, 1, 10) = '" + pr._data + "'  and m.data =  '" + pr._data + "'" +
            " order by f.timestamp_key,m.id"
        pr._param = [];
        _sql.fncSQL(pr._sql, pr._param)
            .then(function (result) {
                let id
                let distanza
                let timestamp_key
                result.forEach(function (i) {
                    distanza =
                        distance(
                            i.lat,
                            i.lon,
                            i.position_lat,
                            i.position_long,
                            "K"
                        ) * 1000;
                    if (distanza <= i.radius)
                    {
                        pr._param.push([i.id, i.timestamp_key, distanza])
                    }
                })
                rows = pr._param
                pr._param = []
                rows.forEach(function (i, ct) {
                    if (id == undefined) {
                        id = i[0]
                        distanza = i[2]
                        timestamp_key = i[1]
                    }
                    else {
                        if (distanza > i[2]) {
                            id = i[0]
                            distanza = i[2]
                            timestamp_key = i[1]
                        }
                    }
                    if ((ct < rows.length - 1 && rows[ct][0] != rows[ct + 1][0]) ||
                        (ct == rows.length - 1)) {
                        pr._param.push([id, timestamp_key]);
                        distanza = 999
                    }
                })

            }).then(function (result) {
                rows = pr._param
                pr._param = []
                rows.forEach(function (i, ct) {
                    if ((ct < rows.length - 1 && rows[ct][1] != rows[ct + 1][1]) ||
                        (ct == rows.length - 1))
                    {
                        pr._param.push(i);
                    }    
                })
                rows = pr._param
                pr._param = []
                rows.forEach(function (i, ct) {
                    if ((ct < rows.length - 1 && rows[ct][0] != rows[ct + 1][0]) ||
                        (ct == rows.length - 1)) {
                        pr._param.push(i);
                    }
                })
                
                pr._sql = "update fit set mil=? where timestamp_key=?"
                return _sql.fncRUN(pr._sql, pr._param);

            }).
            then(function (result) {
                resolve(pr)
            })
    })
}

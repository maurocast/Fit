        /**
        * Conversione archivio Fit da binario a db
        */

/** moduli */
var _sql = require("./fitgetpg_sql");
var _fs = require("./fitget_fs");
const FitParser = require("fit-file-parser").default;

/** routine richiamata */
module.exports = { importFile };
/**
 * Main
 * routine richiamata da menu o da button
 * a fine routine riporta in console 'fine'   
*/
async function importFile(pr) {
    return new Promise(function (resolve, reject) {
        /**
         *  Viene effettuata la lettura del file ricevuto in pr._param.
            se il file non è di tipo binario viene indicato il tipo di file.
            in caso di errore la funzione termina perchè non viene eseguita
            la successiva then
        */
        /** chiamata iniziale alla prima Promise */
        _fs.fnc_readFile(pr)
            .then(function (result) {
                /**
                 * trasformazione in array da passare al Parser
                 */
                pr._param = result;
                function transformBinarytoFit(pr) {
                    return new Promise(function (resolve, reject) {
                        /** trasformazione in array
                         * parametri
                         */
                        var fitParser = new FitParser({
                            force: true,
                            speedUnit: "km/h",
                            lengthUnit: "km",
                            temperatureUnit: "kelvin",
                            elapsedRecordField: true,
                            mode: "both",
                        });
                        /* Parse your file array in pr._param*/
                        fitParser.parse(pr._param, function (err, result) {
                            if (err) {
                                console.log("File " + pr._filename + " non convertito da bin.")
                                reject(err);
                            } else {
                                /**
                                 * trasformazione riuscita
                                 */
                                console.log("File " + pr._filename + " convertito da bin. rec. " +
                                    result.records.length);
                                /**
                                 * 
                                 * @param {result} result array ricevuta da bin 
                                 * @returns array contenente i dati da scrivere sul file
                                 */
                                function scriviDatiFileFit(result) {
                                    var count = 0;
                                    var tempo_tot = 0;
                                    var distance_relativa = 0;
                                    var tempo = 0;
                                    var velocita = 0;
                                    // tipi rec validi con distance>0
                                    const filtered = result.records.filter(function (rec) {
                                        return rec.position_lat != undefined && rec.distance > 0;
                                    });
                                    len = filtered.length;
                                    /**
                                     * loop dati da binary
                                     */
                                    if (len > 0) {
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
                                                /**
                                                 * array per scrivere fit
                                                 */
                                                function get_timestamp_key(dat) {
                                                    return (timestamp_key = new Date(dat)
                                                        .toISOString()
                                                        .replace("T", " ")
                                                        .replace(".000Z", ""));
                                                }
                                                result.push([
                                                    get_timestamp_key(i.timestamp), // timestamp_key
                                                    distance_fit, // distance
                                                    i.position_lat.toFixed(5), //position_lat
                                                    i.position_long.toFixed(5), //position_long
                                                    0, //mil
                                                    /**
                                                     * campi ora non impostati
                                                     * elevation, // elevation ( Non impostata)
                                                    
                                                    distance_relativa, // ;distance_relativa
                                                    tempo, // tempo
                                                    velocita, // as velocita */
                                                ]);
                                            }
                                            count++;
                                        }
                                    }
                                    else {
                                        err = new Date().toISOString() + "File non convertito " + "/n" + "",
                                            console.log(err)
                                        result = 0
                                        reject()
                                    }
                                    return result
                                }
                                result = scriviDatiFileFit(result)
                                resolve(result)
                            }
                        })
                    })
                }
                return transformBinarytoFit(pr)
            })
            /* 
                delete e write file fit
                result contiene tutte le righe per il file fit
             */
            .then(function (result) {
                pr._rows = result
                /** nessun record letto  */
                if (result[0] == undefined) {
                    reject(0)
                }
                /* impostazione data uscita */
                pr._data = result[0][0].substring(0, 10);
                pr._param = pr._data
                /* 
                delete fit
                delete fit_tes
                delete fit_itinerario
                */
                pr._sql = "SELECT public.fit_delete_files('" + pr._data + "')"
                pr._param = "";
                return _sql.fncRUN(pr);
            })
            /*  scrittura su database fit */
            .then(function () {
                pr._sql =
                    "INSERT INTO fit (timestamp_key,distance,position_lat,position_long,mil) " +
                    "VALUES(?,?,?,?,?)";
                pr._param = pr._rows;
                return _sql.fncRUN(pr);
            })
            /*  scrittura su database fit_tes */
            .then(function () {
                pr._sql =
                    "insert INTO fit_tes (data,file,lat,lon,lat_min,lon_min,lat_max,lon_max,tragitto)" +
                    " SELECT  '" + pr._data + "','" + pr._filename +
                    "',lat,lon,lat_min,lon_min,lat_max,lon_max,'' FROM   fit_latlon " +
                    " where data=?";
                pr._param = pr._data;
                return _sql.fncRUN(pr);
            })
            /*  scrittura su database fit - milestones */
            .then(function () {
                pr._sql = "SELECT public.fit_calculate_milestone('" + pr._data + "')"
                pr._param = "";
                return _sql.fncRUN(pr);
            })
            /*  scrittura su database fit_itinerario */
            .then(function (result) {
                    pr._param = pr._data;
                    pr._sql = "SELECT * from fit_itinerario_w where data=? order by inizio ";
                    return _sql.fncSQL(pr);

            })
            .then(function (result) {
                    //console.log(result);
                    pr._rows = result
                    // scrittura nuovi records
                    pr._param = []
                    let tragitto = "";
                    pr._rows.forEach(function (i) {
                        tragitto += i.indirizzo_a + "-";
                    });
                    pr._sql =
                        "update fit_tes set tragitto = ? where data=?"
                    pr._param = [[tragitto, pr._data]]
                    return _sql.fncRUN(pr);
            })// dati finali della promise
            .then(function (result) {
                        //console.log(result);
                        resolve(result)
            })
            .catch(function (errorString) {
                console.log(errorString)
            })
            .finally(function () {
                //console.log('fine');
            });           
})
}
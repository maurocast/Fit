// funzione server
// reperimento e scrittura punti sul file salite
module.exports = { get_itinerario };
var _sql = require("./fitget_sql");
function get_itinerario(pr) {
    return new Promise(function (resolve, reject) {
    // verifico se tutte le righe hanno l'altitudine
     

    itinerario = []
    pr._type = "SQL_ALL"
    pr._sql =
    "select f.position_lat as lat,f.position_long as lon,e.elevation as el,f.distance as dist," +
    " e.elevation - LAG(e.elevation, 1) OVER(ORDER BY timestamp_key) AS disl " +
    " from fit as f " +
    " left join fit_elevation AS e ON f.position_lat = e.position_lat AND " +
    " f.position_long = e.position_long " +
    " where timestamp_key between ? and ? "
    _sql.fncSQL(pr)
    .then(function (result) {
        filtered = []
        filtered = result.filter(function (rec, ct) {
            if (ct > 0) {
                return (ct > 0 && rec.dist > result[ct - 1].dist)
            }
        })
    result = filtered
        distanza = 0
        dislivello=0
    // loop result per il grafico
    result.forEach(function (el, ct) {
        distanza += el.dist

        if (el.disl > 0)
            {dislivello+=el.disl}
        // Aggiungo a itinerario se divisibile per 10
        if ((ct % 10) == 0) {
            itinerario.push([el.lat, el.lon, distanza, el.el])
        }
        })
     
    // aggiorno punti su fit_salite
    pr._sql = "update fit_salita set pendenza =?," +
        " dislivello = ?, distanza = ?, arrivo = ?,partenza = ?,punti=?" +
        " where mil_da = ? and mil_a = ? "
    pr._param = [[
        result[result.length-1].disl / result[result.length-1].dist / 1000 * 100,
        dislivello,
        result[result.length - 1].dist,
        result[result.length-1].el,
        result[0].el,
        JSON.stringify(itinerario),
        pr.id1,
        pr.id2 
    ]]
        pr._type = "SQL_RUN"
        return _sql.fncRUN(pr)
        }).then(function (result) {
            pr._type = "SQL_ALL"
            pr._sql ="select * from get_salite where mil_da= ? and mil_a=?"
            pr._param = [[
                pr.id1,
                pr.id2
            ]]
            _sql.fncSQL(pr)
        }).then(function (result) {
            resolve(result)
        })
    })
}
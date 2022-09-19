        /**
        * Routine di gestione sql
        */
var sqlite3 = require("sqlite3").verbose();
var crypto = require("crypto");
module.exports = { fncSQL, hashPassword, fncRUN };

// sql
function fncSQL(pr) {
    return new Promise(function (resolve, reject) {
        db = _db(pr);
        let statement = db.prepare(pr._sql);
        statement.all(pr._param, function (error, result) {
            if (error) {
                Error =
                    new Date().toISOString() +
                    "Errore in esecuzione sql: " +
                    pr._sql +
                    " " +
                    pr._param +
                    "<br>" +
                    error;
                console.log(Error)
                reject(Error);
            } else {
                resolve(result);
            }
        });
        statement.finalize();
         
    });
}
// hash campi utente
function hashPassword(param) {
    return new Promise(function (resolve, reject) {
        result = {};
        var hash = crypto.createHash("sha256");
        param.forEach(function (el) {
            hash.update(el);
        });
        result.hash = hash.digest("hex");

        {
            resolve(result)
        }
    });
}
/**
 * Connessione
*/
/* sqllite */
function _db(pr) {

    let db = new sqlite3.Database(pr._DATABASE, function (err) {
        if (err) {
            console.log(err);
        }
    });
    return db;
}


function fncRUN(pr) {
    return new Promise(function (resolve, reject) {
        db = _db(pr);
        if (pr._param.length > 0) {
            statement = db.prepare(pr._sql);
            if (typeof pr._param === "string") {
                Parameters = [pr._param];
            } else {
                Parameters = pr._param;
            }
            ct = 0
            len = Parameters.length;
            for (var i = 0; i < Parameters.length; i++) {
                statement.run(Parameters[i], function (error) {
                    if (error) {
                        Error =
                            new Date().toISOString() +
                            "Esecuzione: " +
                            pr._sql +
                            " " +
                            Parameters[i] +
                            " " +
                            error;
                        console.log(Error);
                        reject(Error);
                    } else {
                        ct += 1
                        if (Parameters.length == 0 || ct == Parameters.length || pr._sql.toUpperCase().startsWith("DELETE")) {
                            resolve("OK");
                            ct = 0
                        }
                    }
                });
            }

            statement.finalize();
        }
        else {
            db.run(pr._sql, pr._param, function (err) {
                if (err) { }
                else
                    resolve("OK")
            });
        }
    })
}
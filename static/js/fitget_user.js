var _sql = require("./fitget_sql");
module.exports = { user };
// gestione utente
// la password è un hash creato dal password + salt
// e non è modificabile direttamente se non attraverso la creazione
// del campo Hash
async function user(pr) {
    return new Promise((resolve, reject) => {
        pr._sql = "select salt from users where username=?";
        pr._p = pr._param.split(",")[1]
        pr._param = pr._param.split(",")[0]
        // Main
        _sql.fncSQL(pr)
            .then(function (result) {
                // effettuo il controllo
                if (result.length > 0) {
                    // preparo i parametri  
                    stringHashPassword = [pr._p, result[0].salt]
                    // eseguo l'hash
                    return _sql.hashPassword(stringHashPassword)
                }
                else { console.log("no result"); }
                // ritorna la seconda Promise
            }).then(function (result) {
                //console.log(result);
                // se tutto ok seleziono i dati dell utente
                pr._sql =
                    "select id,username,Nome,Cognome from users" +
                    " where username =? and password=?";
                pr._param = [pr._param, result.hash];
                // return della Terza Promise
                return _sql.fncSQL(pr)
                // dati finali della promise
            }).then(function (result) {
                // record da user
                if (result.length > 0) {
                    resolve(result[0])
                }
                else { resolve("") }
            })
            // in caso di errore della funzione
            .catch(function (errorString) { console.log(errorString) })
            // esecuzione finale
            .finally(function () {
            });
    });
}
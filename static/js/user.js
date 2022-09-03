var _sql = require("./get_sql");
module.exports = { user };

async function user(pr) {
    return new Promise((resolve, reject) => {
        pr._sql = "select salt from users where username=?";
        // Main
        _sql.fncSQL(pr._sql, pr._param[0])
            .then(function (result) {
                // effettuo il controllo
                if (result.length > 0) {
                    // preparo i parametri per la seconda Promise
                    pr_param = [pr._param[1], result[0].salt]
                    // return della seconda Promise
                    return _sql.hashPassword(pr_param)
                }
                else { console.log("no result"); }
                // ritorna la seconda Promise
            }).then(function (result) {
                    //console.log(result);
                    // preparo i parametri della terza promise
                    pr_sql =
                        "select id,username,Nome,Cognome from users" +
                        " where username =? and password=?";
                    pr_param = ["mauro", result.hash];
                    // return della Terza Promise
                    return _sql.fncSQL(pr_sql, pr_param)
                
                    // dati finali della promise
                }).then(function (result) {
                        //console.log(result[0]);
                        if (result!=""){
                            resolve(result[0])
                        }
                        else
                        { resolve("") }
                    })
                    .catch(function (errorString) { console.log(errorString) })
                    .finally(function () {
                    //    console.log('fine');
                    });
                });
}
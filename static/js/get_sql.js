var sqlite3 = require("sqlite3").verbose();
var crypto = require("crypto");
module.exports = { fncSQL, hashPassword, fncRUN };

// sql
function fncSQL(pr_sql, pr_param) {
  return new Promise(function (resolve, reject) {
    db = _db();
    let statement = db.prepare(pr_sql);
    statement.all(pr_param, function (error, result) {
      if (error) {
        Error =
          new Date().toISOString() +
          "Errore in esecuzione sql: " +
          pr_sql +
          " " +
          pr_param +
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
function _db() {
  
  let db = new sqlite3.Database("Fit.db", function (err) {
    if (err) {
      console.log(err);
    }
  });
  return db;
}

function fncRUN(prsql, prparam) {
  return new Promise(function (resolve, reject) {
    db = _db();
    if (prparam.length > 0) {
      statement = db.prepare(prsql);
      if (typeof prparam === "string" ) {
        Parameters = [prparam];
      } else {
        Parameters = prparam;
      }
      ct = 0
      len = Parameters.length;
      for (var i = 0; i < Parameters.length; i++) {
        statement.run(Parameters[i], function (error) {
          if (error) {
            Error =
              new Date().toISOString() +
              "Esecuzione: " +
              prsql +
              " " +
              Parameters[i] +
              " " +
              error;
            console.log(Error);
            reject(Error);
          } else {
            ct += 1
            if (Parameters.length == 0 || ct == Parameters.length || prsql.toUpperCase().startsWith("DELETE")) {
              resolve("OK");
              ct=0
            }
          }
        });
      }

      statement.finalize();
    }
    else {
      db.run(prsql, prparam, function (err) {
        if (err) { }
        else
          resolve("OK")
      });
    }
  })
}
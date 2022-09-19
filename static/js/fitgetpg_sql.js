/**
* Routine di gestione sql Postegree
*/
const { Pool, Client } = require('pg')

var crypto = require("crypto");
 
module.exports = { fncSQL, hashPassword, fncRUN };

/**
 * Elaborazione generica comando sql select - resolve("OK")
 * @param {*} pr 
 * @returns 
 */

function fncSQL(pr) {
    return new Promise(async function (resolve, reject) {
    /**
     * Sql di tipo select
    /**
        /** trasformo i parametri , modifico pr,_sql */
        [stringaCommandPrepare,
            pr._sql,
            stringaCommandExecute,
            Parameters]
        = await parametersTransform(pr)
        /** string di esecuzione */
        pr._sql="".concat(stringaCommandPrepare,
                pr._sql,
                stringaCommandExecute)
        /** apertura database ed esecuzione comando */
        await _db(pr).then(function (result) {
            resolve(result)
        })
     
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
 * Elaborazione generica comando sql - resolve("OK")
 * @param {*} pr 
 * @returns 
 */
function fncRUN(pr) {
    return new Promise(async function (resolve, reject)
    {
        /** trasformo i parametri , modifico pr,_sql */
        [stringaCommandPrepare,
            pr._sql,
            stringaCommandExecute,
            arParameters]
        = await parametersTransform(pr)
        /** imposto il primo comando */
        _sql = "".concat(stringaCommandPrepare,
            pr._sql,
            stringaCommandExecute)
        /**per ogni singolo parametro creo
         * un altro comando a partire dal record 1 in
         * quanto il record 0 è già presente in _sql
         */        
        ct = 1
        len = arParameters.length
        /**
         * numero campi per ogni riga di arParameters */
        if (arParameters[0]==undefined) {
            debugger;
        }    
        lenp = arParameters[0].length
        /** Loop arParameters */
        while (ct < len)
        {
            contatoreCampi = 0
            stringRows=""
            while (contatoreCampi < lenp)
            {
                stringRows += "'" + arParameters[ct][contatoreCampi] + "'"
                /**
                 * aggiungo una vrigola solo se non è l'ultimo campo
                 */
                if (contatoreCampi != lenp - 1)
                { stringRows+="," }
                contatoreCampi+=1
            }
            /** aggiungo quindi l'esecute alla stessa prepare */
            _sql += "".concat(
                " EXECUTE a" +
                numeroUnivocoPrepare +
                "(" + "1," + stringRows + ");")
        ct+=1
        }
        pr._sql=_sql
        /** apertura database ed esecuzione comando */
        await _db(pr).then(function (result) {
            resolve(result)
        })
    });
}
/** Creazione dllo statement Prepare */
async function parametersTransform(pr)
{
    /** generazione array con parametri */
    arParameters = []
    if (typeof pr._param === "string")
    {
        arParameters.push([pr._param])
    } else {
        arParameters=pr._param;
    }
    /** counter dei parametri */
    numeroParametro = 0
    /* numero dell' istruzione univoco */
    numeroUnivocoPrepare = Date.now();
    //** trasform l'array in una stringa */
    stringaParametro = ""
    stringaCommandPrepare = "PREPARE a" + numeroUnivocoPrepare + "(int) AS "
    /** se la stringa sql include un parametro */
    while (pr._sql.includes("?")) {
        numeroParametro += 1
        /** replace della stringa */
        pr._sql = pr._sql.replace("?", "$" + (numeroParametro + 1))
        /** stringa parametro sempre il primo record */
        if (arParameters.length > 0)
        {
            stringaParametro += ",'" +
            arParameters[0][numeroParametro - 1] + "'"
        }
    }
    /** Execute */
    stringaCommandExecute= "; EXECUTE a" +
        numeroUnivocoPrepare + "("+ "1"+ stringaParametro+ ");"
    
    return [stringaCommandPrepare,
        pr._sql,
        stringaCommandExecute,
        arParameters]
}
/**
 * Connessione
*/
/* PostrgreeSQL */
async function _db(pr) {
    return new Promise(async function (resolve, reject) {
                     
        const pool = new Pool({
            host: pr._pgServer[0],
            user: pr._pgServer[1],
            password: pr._pgServer[2],
            database: pr._pgServer[3],
            port: pr._pgServer[4],
        })
        pool.query(pr._sql, (err, res) => {
           
            if (err)
            { reject(err) }
            
            if (res)
            { resolve(res[1].rows) }  
            
            pool.end()
        })
    })
  /*
        const _db = new pg.Client(config);
            resolve(_db)

        } catch (error) {
            console.log(error)
            reject(error)
        }

    })
        .then(function (db) {
           
            db.connect(function (err) {
                if (err) throw err;
                else {
                    
                    console.log(`Server: ` + pr._pgServer[0]);
                    console.log(`Sql: ` + _sql);
                    db.query(_sql)
                        .then(function (result) {
                            console.log("Eseguite n. " + result[1].rows.length + " righe.")
                            resolve(result[1].rows)
                            done()
                        })

                         si è verificato un errore 
                        .catch(err => {
                            console.log(err);
                        });
                }
            });
        });
*/
}
        /**
        * Server per l'applicazione Fit
        */
/**
 * moduli dell'applicazione server
 */

var http = require('http');
var url = require('url');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
/**
 * moduli dell'applicazione da altri js
 */
var _fs = require("./fitget_fs");
var _sql = require("./fitgetpg_sql");
var _usr = require("./fitget_user");
var _com = require("./fitget_itinerario");
var _imp = require("./importFile");
/***
 * creazione del server http
 */
var server = http.createServer(function (req, res) {
    /**
     * verifico se viene passato un parametro
     */
    var pr = url.parse(req.url, true).query;
    /** stringa queryObject != '' */
    if (Object.keys(pr).length === 0)
    {
        pr = {}
        pr._param = "Fit.json";
        pr._tipofile = "utf8";
        _fs.fnc_readFile(pr)
            .then(function (result) {
                 pr = JSON.parse(result)
            
        /**
        * modifica la pagina richiesta ( "/" oppure no-html)
        * */
        function decodeRequest(request) {
            /**
             * controllo se la richiesta è:
             * vuota,oppure è quella indicata in pr._paginaLoad( fit.json)
             * */
            _request = ["/", pr._paginaLoad, pr._paginaLoad.replace(".html", "")];
            /* ritrovo l'indice nella array */
            index = _request.indexOf(request.url);
            /**
             * se non è tra i tipi indicati riporto la pagina
             * */
            if (index == -1) {
                return request.url;
                /**
                 * Altrimenti riporto la pagina di Load
                 */
            } else {
                return pr._pagineRequest[index];
            }
        }
        _url = decodeRequest(req);
        /**
        * determinazione content-type
         * */
        function contentType(url) {
            /* prendo la parte finale dell url */
            suffissoUrl = url.split(".");
            /* ritrovo l'indice nella array */
            index = pr._suffissoUrl.indexOf(suffissoUrl[suffissoUrl.length - 1]);
            /* se non è tra i tipi indicati imposto text/javascript */
            if (index == -1) {
                return "text/javascript";
            } else {
                return pr._contentType[index];
            }
        }
        _type = contentType(_url);
        /**
        * ricerca cartella del file
        * */
        function positionFile(url) {
            /* prendo la parte finale dell url */
            suffissoUrl = url.split(".");
            /* ritrovo l'indice nella array */
            index = pr._suffissoUrl.indexOf(suffissoUrl[suffissoUrl.length - 1]);
            /* se non è tra i tipi indicati imposto "" */
            if (index == -1) {
                return "";
            } else {
                /* se il file contiene gia il folder */
                if ((url.startsWith("/" + pr._folder[index]))
                    ||
                    /* oppure se sta richiamando da node_modules */
                    (url.startsWith("/" + "node_modules")))
        /* imposto "" */ { pr._folder[index] = "" }
                return pr._folder[index];
            }
        }
        _fileFolder = positionFile(_url);
        /**
        * invio al browser e segnalazione errori
        * */
        function sendFileContent(response, fileFolder, fileName, pr) {
            // lettura del file dalla cartella
            pr._param = fileFolder + fileName;
            pr._tipofile = ""
            _fs.fnc_readFile(pr).then(function (result) {
                response.writeHead(200, { "Content-Type": contentType(fileName), });
                response.write(result);
                response.end();
            });
        } 
                sendFileContent(res, _fileFolder, _url.toString().substring(1), pr);
        })
    }
    /**
     * eseguo le routine richieste
     * */ 
    else     
        pr = JSON.parse(decodeURI(url.parse(req.url, true).search).substring(1)) 
    {
    // lettura file
    if (pr._type == "fs" && pr._sql == "readFile") {
        // read file 
        _fs.fnc_readFile(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res)
        });
    }
    // lettura file line by line
    else if (pr._type == "fs" && pr._sql == "readFilelineByline") {
        _fs.fnc_readFilelineByline(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res);
        })
    }
    // lettura directory
    else if (pr._type == "fs" && pr._sql == "readdir") {
        _fs.positionFiledir(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res)
        })
    }
    // importazione dei files
    else if (pr._sql == "get_import_file_bin") {
        _imp.importFile(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res)
        })
    }
    // user e controllo
    else if (pr._type == "user") {
        _usr.user(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res);
        })
        }
    // sql ritorna tutte le righe
    else if (pr._type == "SQL_ALL") {
        _sql.fncSQL(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res);
        })
    } 
    // ritorna solo la prima riga
    else if (pr._type == "SQL") {
        _sql.fncSQL(pr._sql, pr._param).then(function (result) {
            returnLoad(JSON.stringify(result[0]), res);
        })
    }
    // esegue funzione
    else if (pr._type == "SQL_RUN") {
        _sql.fncRUN(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res);
        })
    } 
    // Request per elevation
    else if (pr._type == "REQUEST") {
        function get_elev(latlon) {

            let XHR;
            XHR = new XMLHttpRequest();
            return new Promise(function (resolve, reject) {
                XHR.addEventListener("load", function (event) {
                    {
                        //  console.log(XHR.responseText)
                        resolve(JSON.parse(XHR.responseText));
                    }
                });
                XHR.addEventListener("error", function (event) {
                    reject("Errore codice = " + XHR.status);
                });


                XHR.open("get", "https://api.opentopodata.org/v1/eudem25m?locations=" +
                    latlon, true);

                XHR.send();
            });
        }
        get_elev(pr._param).then(function (result) {
        pr._param = ""
        returnLoad(JSON.stringify(result), res);
        })
    }
    // esegue funzione su server
    else if (pr._type == "SQL_NODE") {
        _com.get_itinerario(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res);
        })
    }  
    // promise risolta,invio al browser
    function returnLoad(result, response) {
        //  ritorna i dati alla funzione load
        response.write(result);
        response.end();
    }
    }    
});
/**
 * Assegnazione porta server da file fit.json
 * */
function AssegnaPorta(server){
    pr = {}
    pr._param = "Fit.json";
    pr._tipofile = "utf8";
    _fs.fnc_readFile(pr)
    .then(function (result) {
        pr = JSON.parse(result)
        let port = process.env.PORT;
        if (port == null || port == "") {
            port = pr._Porta;
        }
        /**
         * esecuzione listen
         */
        server.listen(port);
        console.log("Server http avviato su porta: " + port);
    });
}
AssegnaPorta(server)
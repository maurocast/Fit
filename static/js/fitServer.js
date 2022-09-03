//
// server per l'applicazione Fit
//

// Assegnazione porta server 3001
port = impostaPorta();
//

var http = require('http');
var url = require('url');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var _fs = require("./fitget_fs");
var _sql = require("./fitget_sql");
var _usr = require("./fitget_user");
var _com = require("./fitget_itinerario");
var _imp = require("./importFile");

//var _imp = require("./fitimportFile");
// Main
var server = http.createServer(function (req, res) {
    // eventualmente con parametro
    var pr = url.parse(req.url, true).query;
     
    // stringa queryObject != ''
    if (Object.keys(pr).length === 0)
    {
        Object.create(pr)
        // verifico pagina
        _url = decodeRequest(req);
        // content-type
        _type = contentType(_url);
        // positione del file
        _fileFolder = positionFile(_url);
        // Invio dei files
        sendFileContent(res, _fileFolder, _url.toString().substring(1),pr);
    }
    // eseguo le routine richieste
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
    // esegue funzione
    else if (pr._type == "SQL_RUN") {
        _sql.fncRUN(pr).then(function (result) {
            returnLoad(JSON.stringify(result), res);
        })
    } 
    // Request per elevation
    else if (pr._type == "REQUEST") {
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
server.listen(port);
// server avviato
console.log("Server avviato su porta: " + port);
//
// Imposta porta
function impostaPorta() {
    let port = process.env.PORT;
    if (port == null || port == "") {
        port = 3000;
    }
    return port;
}
// modifica la pagina richiesta ( "/" oppure no-html)
function decodeRequest(request) {
    // controllo se la richiesta è: 
    // vuota,oppure fitIndex
    _request = ["/", "/fitIndex"];
    _requestURL = ["/fitIndex.html", "/draw.html"]
    // ritrovo l'indice nella array
    index = _request.indexOf(request.url);
    // se non è tra i tipi indicati imposto text/javascript
    if (index == -1) {
        return request.url;
    } else {
        return _requestURL[index];
    }    
}
// determinazione content-type
function contentType(url) {
    _suffissoUrl = ["html", "css", "ico", "jpg", "png", "gif", "svg", "js"];
    _contentType = [
        "text/html",
        "text/css",
        "image/x-icon",
        "image/x-icon",
        "image/x-icon",
        "image/x-icon",
        "image/svg+xml",
        "text/javascript",
    ];
    // prendo la parte finale dell url
    suffissoUrl = url.split(".");
    // ritrovo l'indice nella array
    index = _suffissoUrl.indexOf(suffissoUrl[suffissoUrl.length - 1]);
    // se non è tra i tipi indicati imposto text/javascript
    if (index == -1) {
        return "text/javascript";
    } else {
        return _contentType[index];
    }
}
// invio al browser e segnalazione errori
function sendFileContent(response,fileFolder, fileName,pr) {
    // lettura del file dalla cartella
    pr._param = fileFolder + fileName;
    pr._tipofile = ""
    _fs.fnc_readFile(pr).then(function (result) {
        response.writeHead(200, { "Content-Type": contentType(fileName), });
        response.write(result);
        response.end();
    });
} 
// ricerca cartella del file
function positionFile(url) {
    // tipo dile
    _suffissoUrl = ["html",  "ico", "jpg", "png", "gif", "svg", "js"];
    // folder
    _folder = ["static/html/",  "static/images/", "static/images/", "static/images/", "static/images/", "static/images/", "static/js/"]
    // prendo la parte finale dell url
    suffissoUrl = url.split(".");
    // ritrovo l'indice nella array
    index = _suffissoUrl.indexOf(suffissoUrl[suffissoUrl.length - 1]);
    // se non è tra i tipi indicati imposto text/javascript
    if (index == -1) {
        return "";
    } else {
        // se il file contiene gia il folder
        if ((url.startsWith("/" + _folder[index])) 
        ||
        (url.startsWith("/" + "node_modules")))
        { _folder[index] = "" }    
        return _folder[index];
    }
}
// esecuzione delle funzioni richieste
function elaborazioni(pr,res)
{
    return new Promise(function (resolve, reject) {
     
   
    
   
    // lettura file line by line
     if (pr._type == "fs" && pr._sql == "readFilelineByline") {
        _fs.fnc_readFilelineByline(pr).then(function (result) {
            promiseResolved(result, response);
        })
    }
     
    
    
    // ritorna solo la prima riga
    if (pr._type == "SQL") {
        _sql.fncSQL(pr._sql, pr._param).then(function (result) {
            promiseResolved(result[0], response);
        })
    }
    
    // esegue funzione
    else if (pr._type == "SQL_RUN") {
       _sql.fncRUN(pr._sql, pr._param);
        promiseResolved(result, response).then(function (result) {
            promiseResolved(result, response);
        })    
        }
    

    
    // promise in errore,invio al browser
    function promiseRejected(Error, response) {
        response.write(JSON.stringify(Error));
        response.end();
    }
    
    });
   
}
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
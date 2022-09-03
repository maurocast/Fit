var http = require("http");
var fs = require("fs");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const { resolve } = require("path");
var _fs = require("./get_fs");
var _sql = require("./get_sql");
var _usr = require("./user");
var _imp = require("./importFile");
//
//
port = impostaPorta();
// Main
http
  .createServer(async function (request, response) {
    // tipo di request
    let [pr, url, tipo] = decodeRequest(request, response);
    // Elaborazioni
    if (tipo == "Elaborazioni") {
      // lettura directory
      if (pr._type == "fs" && pr._sql == "readdir") {
        _fs.positionFiledir(pr).then(function (result) {
          promiseResolved(result, response);
        })
      }
      // lettura file
      else if (pr._type == "fs" && pr._sql == "readFile") {
        _fs.fnc_readFile(pr).then(function (result) {
          promiseResolved(result, response);
        })
      }
      // lettura file line by line
      else if (pr._type == "fs" && pr._sql == "readFilelineByline") {
        _fs.fnc_readFilelineByline(pr).then(function (result) {
          promiseResolved(result, response);
        })
      }  
      // user
      else if (pr._type == "user") {
        _usr.user(pr).then(function (result) {
          promiseResolved(result, response);
        })
      }
      // 
      else if (pr._type == "REQUEST") {
       
        s = pr._param.split("§")
        pr._param=""
        s.forEach(function (i) {
          pr._param+= i+"|"
        })
        result = await get_elev(pr._param);
        pr._param=""
        promiseResolved(result, response);
      }
      // importazione dei files
      else if (pr._sql == "get_import_file_bin") {
        _imp.importFile(pr).then(function (result) {
          promiseResolved("Terminata importazione", response);
        })
      }
      // ritorna solo la prima riga
      if (pr._type == "SQL") {
        result = await _sql.fncSQL(pr._sql, pr._param);
        promiseResolved(result[0], response);
      }
      // ritorna tutte le righe
      else if (pr._type == "SQL_ALL") {
        result = await _sql.fncSQL(pr._sql, pr._param);
        promiseResolved(result, response);
      }
      // esegue funzione
      else if (pr._type == "SQL_RUN") {
        result = await _sql.fncRUN(pr._sql, pr._param);
        promiseResolved(result, response);
      }
    }
    // file css ,html e immagini
    else {
      if (
        request.url.toString().endsWith(".html") ||
        request.url.toString().endsWith(".ico") ||
        request.url.toString().endsWith(".jpg") ||
        request.url.toString().endsWith(".png") ||
        request.url.toString().endsWith(".gif") ||
        request.url.toString().endsWith(".css") ||
        request.url.toString().endsWith(".js")
      ) {
        // Invio dei files
        sendFileContent(response, request.url.toString().substring(1));
      }
    }
  })
  .listen(port);
  
console.log("Server avviato.Porta: " + port);
// invio al browser e segnalazione errori
function sendFileContent(response, fileName) {
  fileName = positionFile(fileName);
  fs.readFile(fileName, function (err, data) {
    if (err) {
      // non è stato trovato il file
      console.log("Errore 404. /n Non e' stato trovato il file " + fileName);
    } else {
      response.writeHead(200, {
        "Content-Type": contentType(fileName),
      });
      response.write(data);
    }
    response.end();
  });
}
// Imposta porta
function impostaPorta() {
  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 3000;
  }
  return port;
}
// posizionamento cartelle
function positionFile(fileName) {
  if (fileName.endsWith(".html")) {
    return "static/html/" + fileName;
  } else if (
    fileName.endsWith(".ico") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".gif")
  ) {
    if (fileName.startsWith("node_modules")) { return fileName }
    else {
      return "static/images/" + fileName;
    }

  } else {
    return fileName;
  }
}
// determinazione content
function contentType(fileName) {
  fname = ["html", "css", "ico", "jpg", "png", "gif", "svg", "js"];
  fcont = [
    "text/html",
    "text/css",
    "image/x-icon",
    "image/x-icon",
    "image/x-icon",
    "image/x-icon",
    "image/svg+xml",
    "text/javascript",
  ];
  fileN = fileName.split(".");
  index = fname.indexOf(fileN[fileN.length - 1]);
  if (index == -1) {
    return "text/javascript";
  } else {
    return fcont[index];
  }
}
// decodifica richiesta dal browser
function decodeRequest(request, response) {
  if (decodeURI(request.url).split("|").length > 1) {
    return [
      JSON.parse(decodeURI(request.url).split("|")[1]),
      (request.url = decodeURI(request.url).split("|")[0]),
      "Elaborazioni",
    ];
  } else {
    if (["/", "/index", "/documentazione", "/draw"].includes(request.url)) {
// avvio di default, richiamata pagina index
      if (request.url == "/") {
        request.url = "/index";
      }
      request.url = request.url + ".html";
    }
//
    return ["", request.url, "Invio"];
  }
}
// promise risolta,invio al browser
function promiseResolved(result, response) {
  //  console.log(result);
  response.write(JSON.stringify(result));
  response.end();
}
// promise in errore,invio al browser
function promiseRejected(Error, response) {
  response.write(JSON.stringify(Error));
  response.end();
}

function get_elev(lat, lon) {

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
      lat , true);

    XHR.send();
  });
}
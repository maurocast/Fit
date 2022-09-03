var fs = require("fs");
module.exports = { fnc_readFile, fnc_readFilelineByline, positionFiledir };

async function fnc_readFilelineByline(pr) {
  return new Promise(function (resolve, reject) {
    fs.readFile(pr._param, pr._tipofile, function (error, result) {
      if (error) {
        Error = "File " + pr._param + "non trovato " + "<br" + error
        reject("KO");
      } else {
        res=[]
        result.split(/\r?\n/).forEach(function(line) {
          res.push(line);
        });
        resolve(res);
      }
    });
  });
}

async function positionFiledir(pr) {
  return new Promise(function (resolve, reject) {
    fs.readdir(pr._param, function (error, result) {
      if (error) {
        Error =
          "Directory " + pr._param + " non trovata" + "<br>" + error.message
          reject("KO")
      } else {
    /*    console.log(
          new Date().toISOString() +
            " Esecuzione lettura directory: " +
            pr._param
        );*/
        resolve(result)
      }
    });
  });
}
async function fnc_readFile(pr) {
  return new Promise(function (resolve, reject) {
    fs.readFile(pr._param, pr._tipofile, function (error, result) {
      if (error) {
        Error = "File " + pr._param + "non trovato " + "<br" + error
          reject("KO");
      } else {
        // utf-8
        tipofile = pr._tipofile;
        function tpf(tipofile) {
          if (tipofile == "") {
            return "non definito";
          } else {
            return tipofile;
          }
        }
        /*
        console.log(
          new Date().toISOString() +
            " Fase  1 - Esecuzione lettura file: " +
            pr._param +
            " tipo: " +
            tpf(tipofile)
        );
        */
        resolve(result);
      }
    });
  });
}
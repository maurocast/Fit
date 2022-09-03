// importazione dati da file binario Brython a db sqlite
// generazione archivi Fit
// main importazione
async function get_import() {
    // files presenti nella Directory
    result = await get_files_in_directory(pr);

    // esecuzione importazione files non presenti sul fit_tes
    filesDirectory = result.sort().reverse();
    len = filesDirectory.length;
    contatore = 0;
    while (contatore < len) {
        // fileEsistenti
        pr._filename = filesDirectory[contatore];
        Filespassati = await get_files_passati(pr);
        // file non trovato sull'archivio
        if (Filespassati.length == 0) {
            // read file e trasferisci db
            // return data del file
            data = await get_import_file_bin(pr);
        }
        contatore += 1;
    }
}
// vengono selezionati tutti ii files della directory
// se +è stato impostato il singolo file viene selezionato quello
async function get_files_in_directory(pr) {
    pr._type = "fs";
    pr._sql = "readdir";
    pr._param = pr._DIRECTORY;
    let filesDirectory = await load(pr);
    filtered = []
    if ((pr._fileDaElaborare != "") && (pr._fileDaElaborare != undefined)) {
        filtered = filesDirectory.filter(function (rec) {
            return rec.includes(pr._fileDaElaborare)
        })
    }
    else {
        filtered = filesDirectory
    }
    // elimino il parametro con il file singolo per evitare venga rielaborato
    pr._fileDaElaborare = ""
    return filtered;
}
// selezione dati di testata dei file già passati
// ritorna un array 
async function get_files_passati(pr) {
    pr._sql = "SELECT * FROM fit_tes where file=?";
    pr._type = "SQL_ALL";
    pr._param = pr._filename;
    let files_passati = await load(pr);
    return files_passati;
}
// routine effettiva di importazione dei files
// server
async function get_import_file_bin(pr) {
    pr._type = "fs";
    pr._sql = "get_import_file_bin";
    pr._tipofile = "";
    pr._param = pr._DIRECTORY + "/" + pr._filename;
    let data = await load(pr);
    return data;
}
// funzione di lancio sul server
function xxload(pr) {
    let XHR;
    XHR = new XMLHttpRequest();
    return new Promise(function (resolve, reject) {
        XHR.addEventListener("load", function (event) {
            {
                // funzione riuscita ritorna il risultato
                resolve(JSON.parse(XHR.responseText));
            }
        });
        XHR.addEventListener("error", function (event) {
            // errore nell'esecuzione
            reject("Errore codice = " + XHR.status);
        });
        // preparazione stringa per il Server
        XHR.open("POST", pr._paginaLoad + "|" + JSON.stringify(pr));
        XHR.send();
    });
}
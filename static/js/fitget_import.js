            /**
             *  importazione dati da file binario Brython a db  
                generazione archivi Fit
                main importazione
            * */ 
async function get_import() {
    /*
        files presenti nella Directory
    */ 
    function get_files_in_directory(pr) {
        return new Promise(async function (resolve, reject){
            pr._type = "fs";
            pr._sql = "readdir";
            pr._param = pr._DIRECTORY;
            let filesDirectory = await load(pr);
            /**
             * solo se richiesto uno specifico file
             */
            filtered = []
            if ((pr._fileDaElaborare != "") && (pr._fileDaElaborare != undefined)) {
                filtered = filesDirectory.filter(function (rec) {
                    return rec.includes(pr._fileDaElaborare)
                })
            }
            else {
                filtered = filesDirectory.sort().reverse()
            }
            /**
             * Tutti i nomi dei files elaborati
             */        
            pr._sql = "SELECT file FROM fit_tes";
            pr._type = "SQL_ALL";
            pr._param = [];
            await load(pr)
            .then(function (result) {
                    arResult = []
                    result.forEach(function(i)
                    {
                        arResult.push(i.file)
                    })
                    result.sort().reverse()
                    filtered = filesDirectory.filter(function (rec) {
                        return !arResult.includes(rec)
                    })
            })
            /* elimino il parametro con il file singolo per evitare venga rielaborato */
            pr._fileDaElaborare = ""
            /**
             * Contiene l'array di tutti i file da elaborare oppure
             * solo quello richiesto
             */
            resolve(filtered.sort().reverse())
        })
    }
    get_files_in_directory(pr)
    .then(async function (result) {
        // esecuzione importazione files non presenti sul fit_tes
        filesDirectory = result;
        len = filesDirectory.length;
        contatore = 0;
        while (contatore < len) {
            pr._filename = filesDirectory[contatore];
            // read file e trasferisci db
            // return data del file
            // routine effettiva di importazione dei files
            // server
            function get_import_file_bin(pr) {
                return new Promise(async function (resolve, reject) {
                    pr._type = "fs";
                    pr._sql = "get_import_file_bin";
                    pr._tipofile = "";
                    pr._param = pr._DIRECTORY + "/" + pr._filename;
                    let data = await load(pr);
                    resolve(data)
                })
            }
            await get_import_file_bin(pr)
                .then(function (result) {                        
            })
        contatore += 1;
        } 
        console.log("Fine importazione")   
    })
}
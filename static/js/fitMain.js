/**
 * impostazioni di base della procedura Fit
*/

dc = {}  // dati comuni
pr = {}  // parametri
// inclusione delle funzioni javascript come script
include()
/**
 * routine richiamata dal caricamento dell' elemento body del file fitIndex.html
*/
function fitMain() {
    // impostazione dc - dati comuni
    get_dc();
    // impostazione parametri da file Fit.Json
    get_parametri();
    // elementi da nascondere, da visualizzare block,da visualizzare flex.
    hidden_div(
        ["div_logged", "div_logerror", "div_popupMilestone", "div_popupNuovoMilestone", "filter_div"], [], []);
    // gestione voci menu
    get_menu();
}
// include script
// Viene aggiunto all'head della pagina fitIndex.html i files
// di tipo js contenenti le funzioni
function include() {
    [
        "fnc_wait", "fitget_chart", "get_login_logout", "fitget_menu", "fitget_uscite",
        "fitget_layers_uscita",  "fitget_milestones", "get_comuni",
        "fitget_import", "hidden_div", "fitMapElements","fitget_elevation"
    ]
        .forEach(function (el) {
            var script = document.createElement("script");
            script.src = "/static/js/" + el + ".js";
            script.type = "text/javascript";
            document.getElementsByTagName("head").item(0).appendChild(script);
        })
}
// Impostazione degli oggetti comuni, validi per tutta la procedura
// ogni oggetto è richiamato dalla corrispondente funzione get_
// oppure viene richiesto a video ( Es.: name)
function get_dc() {
    dc.name = document.getElementById("name");
    dc.password = document.getElementById("password");
    dc.user = document.getElementById("user");
    dc.Importazione = document.getElementById("Importazione");
    dc.Visualizzazione = document.getElementById("Visualizzazione");
    dc.Milestones = document.getElementById("Milestones");
    dc.FormLogin = document.getElementById("FormLogin");
    dc.opzioni_add_Milestones = document.getElementById("opzioni_add_Milestones");
    dc.idlogin = document.getElementById("idlogin");
    dc.idlogout = document.getElementById("idlogout");

    dc.data_grafico_mil_popup = []
    dc.data_grafico = []

    dc.cssClassNames = {
        headerRow: "cssHeaderRow",
        tableRow: "cssTableRow",
        oddTableRow: "cssOddTableRow",
        selectedTableRow: "cssSelectedTableRow",
        hoverTableRow: "cssHoverTableRow",
        headerCell: "cssHeaderCell",
        tableCell: "cssTableCell",
        rowNumberCell: "cssRowNumberCell",
    };
    dc.options = {
        cssClassNames: dc.cssClassNames,
        pageSize: 15,
        allowHtml: true,
        page: "enable",
        width: "100%",
        height: "100%",
    };

    dc.target = ""
    dc.ro = ""
    
    dc.dati_tabella = ""
   

    
    dc.tooltip = new L.FeatureGroup()
    dc.CircleMarker = new L.FeatureGroup()

    dc.layers_uscita = new L.FeatureGroup()
    dc.layers_uscitaminori = new L.FeatureGroup()
    dc.layers_uscitamaggiori = new L.FeatureGroup()
    dc.lastlatlng=0
}
// Impostazione parametri
// chiamata alla funzione node.js _fs.fnc_readFile 
async function get_parametri() {
    pr._type = "fs";
    pr._sql = "readFile";
    pr._param = "Fit.json";
    pr._tipofile = "utf8";
    // pagina da richiamare nella funzione load da server
    pr._paginaLoad = "fitIndex.html"
    load(pr).then(function (result) {
        let parametri = JSON.parse(result);
        // Parametri ricevuti
        pr._DIRECTORY = parametri.path_file;
        pr._DATABASE = parametri.databaseSqlLite;
    })
}
//
//
// definizione dei parametri per la gestione delle map da Leaflet
function tileMap(map) {
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v9',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'pk.eyJ1IjoibWF1cm9jYXN0ZWxsb3R0aSIsImEiOiJjbDB6Zzh0dDExbzVhM2pwZTQ0OG5lcTdkIn0.PTpB561qTbN47HyDLJ9GUg'
    }).addTo(map);
}
//
// funzione generica di esecuzione di una procedura sul server
// vengono passati tutti i pararmetri con paramerti della pagina fitIndex
function load(pr) {
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
        // unico parametro pr
        // fitServer effettua il parse
            XHR.open("POST", pr._paginaLoad + "?" + JSON.stringify(pr));
        XHR.send();
    });
}
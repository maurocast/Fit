
// Routine di visualizzione delle tabelle e dei grafici


function ricalcoloMilestones(data) {
    //    div.addEventListener("click", function () {
    pr._type = "SQL_ALL";
    pr._sql = "Select * from fit_tes where data=? ";
    pr._param = data;
    load(pr).then(function (result) {
        // delete testata
        if (result != []) {
            // viene eseguita l'importazione di questo file, dopo la cancellazione
            // del file di testata
            pr._fileDaElaborare = result[0].file;
            pr._type = "SQL_RUN";
            pr._sql = "delete from fit_tes where data=? ";
            pr._param = data;
            load(pr)
                .then(function (result) {
                    // delete testata
                    get_import();
                });
        }
        else {
            alert("file in data " + row.data + " non trovato.");
        }
    });
    //        });
}

// tabella uscita
async function Chart_table_map() {
    // file: fit_itinerario_w
    var data = new google.visualization.DataTable();
    data.addColumn({ type: "date", label: "" });
    data.addColumn({ type: "string", label: "Data " });
    data.addColumn({ type: "string", label: "Milestone" });
    data.addColumn({ type: "string", label: "durata" });
    data.addColumn({ type: "string", label: "km" });
    data.addColumn({ type: "string", label: "km/h" });
    data.addColumn({ type: "string", label: "mt" });
    data.addColumn({ type: "number", label: "" });
    // dettaglio
    dc.data_grafico.forEach(function (item, ct) {
        data.addRow([
            fnc_data(item.data, "d"), // data
            fnc_data(item.data, "s"), // data string
            item.indirizzo_a, // inidirizzo arrivo
            fnc_totime(item.durata).toString(), // durata in h:m:s
            (Math.round((item.km + Number.EPSILON) * 100) / 100).toString(), // km
            (Math.round((item.Km_h + Number.EPSILON) * 100) / 100).toString(), // km_h
            item.dislivello.toString(), // dislivello
            item.selezionato, // flag selected
        ]);

        // cambio style se elezionato
        if (item.selezionato == 1) {
            i = 0
            while (i < data.getNumberOfColumns()) {
                data.setProperty(ct, i, "style", "background-color:green;");
                i += 1
            }
        }
    });
    // associazione div
    var table = new google.visualization.Table(
        document.getElementById("map_table")
    );
    // aggiungo righe vuote
    counter = data.getNumberOfRows()
    if (dc.data_grafico.length > 0) {
        var rem = -data.getNumberOfRows() + (1 + Math.round(data.getNumberOfRows() / 10)) * 10
        ct = 0
        while (ct < rem) {
            data.addRow([
                new Date(),
                "-",
                "-",
                "-",
                "-",
                "-",
                "-",
                2,
            ]);
            ct += 1
            i = 0
            while (i < data.getNumberOfColumns()) {
                data.setProperty(counter + ct - 1, i, { style: 'color: #f0f1f2' });
                i += 1
            }
        }
    }
    // visualizzzazione
    var view = new google.visualization.DataView(data);
    // colonne da visualizzare
    view.setColumns([2, 3, 4, 5, 6]);
    // evento ready non utilizzato
    google.visualization.events.addListener(table, 'ready', function () { });
    // seleziona
    google.visualization.events.addListener(table, "select", async function () {
        var selectedItem = table.getSelection()[0].row;
        // se click modifico lo stato da selezionato a no e viceversa
        if (selectedItem) {
            if (dc.data_grafico[selectedItem].selezionato == 0) { dc.data_grafico[selectedItem].selezionato = 1 }
            else { dc.data_grafico[selectedItem].selezionato = 0 }
            // riesegue la tabella per evidenziare le righe segnate
            Chart_table_map()
        }
    });
    // options
    var options = {
        showRowNumber: true,
        cssClassNames: dc.cssClassNames,
        pageSize: 10,
        allowHtml: true,
        page: "enable",
        width: "100%",
        height: "100%",
    };
    // visualizzo la tabella
    table.draw(view, options);
}
// controllo validita elevation, se non esiste prende la precedente
function checkElevation(ielevation, cx, pr_param) {
    if (ielevation == null || ielevation == 0) {
        if (cx > 0) {
            ielevation = pr_param[cx - 1][0]
        }
        else {
            ielevation = 0
        }
    }
    return ielevation
}

// visualizzazione completa uscita
// visualizzazione in overlay della mappa
function Chart_uscita(riga_selezionata_data) {
    // wait
    // wait
    fnc_wait()
    google.charts.load('current', { 'packages': ['corechart', 'line', 'bar'] });
    hidden_div(["div_container"], ["map_chart_uscita"], []);

    pr._type = "SQL_ALL";
    pr._sql = "select timestamp_key from get_fit where data = ?";
    pr._param = riga_selezionata_data;
    load(pr).then(function (result) {
        // routine di elaboratione dell elevation
        inizio = result[0].timestamp_key
        fine = result[result.length - 1].timestamp_key
        aggiorna_elevation_salita(inizio, fine)
            .then(function () {
                //
                pr._type = "SQL_ALL";
                pr._sql = "SELECT m.indirizzo,m.city,f.mil,f.distance,e.elevation FROM fit AS f" +
                    " LEFT JOIN fit_milestone as m ON f.mil = m.id " + 
                    " LEFT JOIN fit_elevation AS e ON f.position_lat = e.position_lat AND " +
                    " f.position_long = e.position_long where e.elevation<>0 and  f.timestamp_key between ? and ? "
                pr._param = [inizio, fine];
                load(pr)
                    .then(function (result) {
                        rowFit = result
                        var data = new google.visualization.DataTable();
                        data.addColumn({ type: "number", label: "distanza " });
                        data.addColumn({ type: "number", label: "elevation" });
                        // annotation
                        data.addColumn({ type: 'string', role: 'annotation' });
                        data.addColumn({ type: 'string', role: 'annotationText' });
                        // annotation
                        data.addColumn({ type: 'number', role: 'interval' });
                        data.addColumn({ type: 'number', role: 'interval' });
                        var formatter = new google.visualization.NumberFormat(
                            { prefix: '$', negativeColor: 'red', negativeParens: true });
                        formatter.format(data, 0); // Apply formatter to second column    
                        _max = 0
                        _min = 9999
                        dislivello = 0
                        altezza = []

                        rowFit.forEach(function (item, rowNumber) {
                            function elev(elevation) {
                                if (rowNumber > 4) {
                                    tot = 0
                                    i = rowNumber - 5
                                    while (i < rowNumber) {
                                        tot += rowFit[i].elevation
                                        i += 1
                                    }
                                    elevation = tot / 5
                                }

                                return parseInt(elevation)
                            }
                            el_calculated = elev(item.elevation)
                            annotation = null
                            annotationText = null
                            interval1=null
                            interval2=null
                            if (item.mil > 0) {
                                annotation = item.mil + " " + item.indirizzo + " "
                                    + item.city
                                annotationText = null
                                interval1 = 0
                                interval2=el_calculated
                            }
                            data.addRow([
                                item.distance / 1000,
                                el_calculated,
                                annotation,
                                annotationText,
                                interval1,
                                interval2
                            ]);
                            altezza.push(el_calculated)

                            if (rowNumber > 0) {
                                if (el_calculated > altezza[rowNumber - 1]) {
                                    dislivello += el_calculated
                                    dislivello -= altezza[rowNumber - 1]
                                }
                            }

                            if (Math.round(item.elevation) > _max) { _max = Math.round(item.elevation) }
                            if (Math.round(item.elevation) < _min) { _min = Math.round(item.elevation) }
                        })
                        dateI = riga_selezionata_data.split("-")
                        var options = {
                            annotations: {
                                alwaysOutside: true,
                                stem: {
                                                                    },
                                textStyle: {
                                     fontSize: 18,
                                    bold: true,
                                    
                                    // The color of the text.
                                    color: 'black',
                                    // The color of the text outline.
                                    auraColor: 'black',
                                    // The transparency of the text.
                                    opacity: 0.8
                                }
                            },
                            legend: { position: 'none' },
                            allowHtml: true,
                            title: dateI[2] + "/" + dateI[1] + "/" + dateI[0],
                            titleTextStyle: {
                                //    color: <string>,    // any HTML string color ('red', '#cc00cc')
                                //        fontName: <string>, // i.e. 'Times New Roman'
                            //    fontSize: 12, //<number>, // 12, 18 whatever you want (don't specify px)
                                bold: true,    // true or false
                                italic: false,   // true of false
                            },
                            hAxis: {
                                format: '###',
                                title: 'Km'
                            },
                            vAxis: {
                                title: 'mt.',
                                
                                gridlines: {
                                    interval: 0
                                }   
                            },
                            backgroundColor: {
                                fill: '#FF0000',
                                fillOpacity: 0.1
                            },
                            gridlines: {
                                color: 'trasparent'
                            }
                        };

                        var chart = new google.visualization.LineChart(
                            document.getElementById("map_chart_uscita")
                        );
                        chart.draw(data, options);
                        /*
                            document.getElementById("Dislivello_item").innerHTML =
                                "Dislivello " + "<br>" + (Math.round(dislivello * 100) / 100.0);
                            
                                document.getElementById("Lunghezza_item").innerHTML =
                                    "Pendenza max " + "<br>" + (Math.round(pendenza/1*100)/100).toString() + "%";
                               
                                document.getElementById("Velocita_item").innerHTML =
                                    "Velocita Media " +
                                    "<br>";
                                document.getElementById("Durata_item").innerHTML =
                                    "Durata " + "<br>"*/
                    })
            })
    })
}
// Visualizzo popup sul milestone
async function Chart_popup() {
    var options = {
        cssClassNames: dc.cssClassNames,
        pageSize: 15,
        allowHtml: true,
        page: "enable",
        width: "100%",
        height: "100%",
    };
    var data = new google.visualization.DataTable();
    data.addColumn({ type: "string", label: "Data" /*+ (await fnc_aggiorna())*/ });
    data.addColumn({ type: "string", label: "Da" });
    data.addColumn({ type: "string", label: "Località", style: 'width:auto' });
    data.addColumn({ type: "string", label: "durata" });
    data.addColumn({ type: "string", label: "km" });
    data.addColumn({ type: "string", label: "km/h" });
    data.addColumn({ type: "string", label: "dislivello" });
    data.addColumn({ type: "number", label: "durata in ms" });
    // in dc.data_grafico_mil_popup dati del solo milestone richiesto
    // dati della tabella
    let intestazione_grafico_popup
    dc.data_grafico_mil_popup.forEach(function (item, ct) {
        function disliv(dis) { if (dis > 0) { return dis.toString() } else { return "" } }
        data.addRow([
            "<a href='javascript: get_map_da_popup(" + item.data.toString().replace("-", "").replace("-", "") + ")'>" + fnc_data(item.data, "s") + "</a>",
            item.mil_da.toString(),
            item.indirizzo_da,
            fnc_totime(item.durata).toString(),
            (Math.round((item.km + Number.EPSILON) * 100) / 100).toString(),
            (Math.round((item.Km_h + Number.EPSILON) * 100) / 100).toString(),
            disliv(item.dislivello),
            item.durata,
        ]);
        data.setProperty(ct, 0, "style", "color:red;");
        intestazione_grafico_popup = item.mil_a + " " + item.indirizzo_a + " alt. m. " + item.altitude
    });
    // ordino per milestone di partenza e durata 
    data.sort([{ column: 1 }, { column: 7 }]);
    var view = new google.visualization.DataView(data);
    view.setColumns([0, 1, 2, 3, 4, 5,]);
    // Visualizza
    // scrittura del innerHTML di div
    div = document.createElement("div")
    div.className = "div_popupMilestone"
    // creo un div per l'intestazione
    var divIntest = document.createElement("div");
    divIntest.id = "divIntest_id"
    divIntest.innerHTML = intestazione_grafico_popup;
    div.appendChild(divIntest);
    // creo un div contenente la tabella
    var divchart = document.createElement("div");
    divchart.id = "divchart_id"
    div.appendChild(divchart);
    var chart = new google.visualization.Table(divchart);
    // seleziona   
    google.visualization.events.addListener(data, "select", function () {
        var selectedItem = view.getSelection()[0];
        // nessuna azione in caso si selezione
        if (selectedItem) { }
    });
    chart.draw(view, options);
    return div
}
// Visualizzo popup sul milestone salita
function disliv(dis) {
    if (dis > 0) { return dis.toString() }
    else { return "" }
}
function intestazione_grafico_popup(el) {
    return new Promise(function (resolve, reject) {
        //  get_dislivello()
        //    .then(function (ar) {
        returnstring = "SALITA:" + "</br>" +
            el.id1 + " - " + el.indirizzo1 + " " + el.city1 + " alt. m. " + el.altitude1 + "</br>" +
            el.id2 + " - " + el.indirizzo2 + " " + el.city2 + " alt. m. " + el.altitude2
        //    })
        resolve(returnstring)
    })
}
// rielaborazione dati grafico
function data_p(ct, item, data_grafico) {
    if (ct > 0) {
        if (item.data != data_grafico[ct - 1].data) { return fnc_data(item.data, "s") }
        else { return "" }
    }
    else { return fnc_data(item.data, "s") }
}
// tabella popup salite
async function Chart_table_salita(el, container, data_grafico) {
    return new Promise(function (resolve, reject) {
        elp = el
        
        var data = new google.visualization.DataTable();
        data.addColumn({ type: "string", label: "fine" /*+ (await fnc_aggiorna())*/ });
        data.addColumn({ type: "string", label: "Data" /*+ (await fnc_aggiorna())*/ });
        data.addColumn({ type: "string", label: "Da" });
        data.addColumn({ type: "string", label: "Località" }); //, style: 'width:auto' 
        data.addColumn({ type: "string", label: "durata" });
        data.addColumn({ type: "string", label: "km" });
        data.addColumn({ type: "string", label: "km/h" });
        data.addColumn({ type: "string", label: "dislivello" });
        data.addColumn({ type: "number", label: "durata in ms" });
        // dati della tabella     
        data_grafico.forEach(function (item, ct) {
            if (item.mil_da == el.id1) {
                data.addRow([
                    item.fine,
                    data_p(ct, item, data_grafico),
                    item.mil_da.toString(),
                    item.indirizzo_da,
                    fnc_totime(item.durata).toString(),
                    (Math.round((item.km_a - item.km_da) * 100) / 100).toString(),
                    (Math.round((item.km_a - item.km_da) / item.durata * 3600 * 100) / 100).toString(),
                    disliv(item.dislivello),
                    item.durata,
                ]);
            }
        });
        // ordino per milestone di partenza e durata 
        data.sort([{ column: 3 }, { column: 8 }]);
        var view = new google.visualization.DataView(data);
        view.setColumns([1, 4, 5, 6]);
        // Visualizza
        container.innerHTML = ""
        container.className = "PopupMilestone"
        // creo un div per l'intestazione
        var divIntest = document.createElement("div");
        divIntest.id = "divIntest_id"
        intestazione_grafico_popup(elp)
            .then(function (returnstring) {
                divIntest.innerHTML = returnstring
                container.appendChild(divIntest);
                // creo un div contenente la tabella
                var divchart = document.createElement("div");
                divchart.id = "divchart_id"
                container.appendChild(divchart);
                var chart = new google.visualization.Table(divchart);
                // seleziona
                google.visualization.events.addListener(view, "select", async function () {
                    var selectedItem = view.getSelection()[0];
                    // nessuna azione in caso si selezione
                    if (selectedItem) { }
                });
                chart.draw(view, dc.options);
                resolve(container)
            });

    })
}
// carica dislivello
function get_dislivello(result) {
    return new Promise(function (resolve, reject) {
        ar = [["km", "Altitudine", { type: "string", role: "tooltip" }]];
        km = 0;
        km_a = 0;
        dislivello = 0;
        dislivelloSalita = 0;
        velocitaMin = 0;
        velocitaMax = 0;
        velocitaMedia = 0;
        velocita = [];
        tvelocita = 0;
        durata = 0;

        result.forEach(function (item) {
            velocita.push(item.Km_h);
            km_a = item.km_a;
            km += item.km;
            dislivello += item.dislivello;
            tvelocita += item.Km_h;
            durata += item.durata;
            if (item.dislivello > 0) {
                dislivelloSalita += item.dislivello;
            }
            if (dislivello < 0) {
                dislivello = 0;
            }
            ar.push([
                (((km + Number.EPSILON) * 100) / 100).toFixed(0).toString(),
                dislivello,
                item.indirizzo_a,
            ]);
        })
        resolve(ar)
    })
}
// grafico dislivello
async function Chart_dislivello(ar) {
    // dati grafico
    google.charts.load('current', { 'packages': ['corechart', 'line'] });

    google.charts.setOnLoadCallback(function () { drawChart(ar) });

    function drawChart(ar) {
        var chart = new google.visualization.LineChart(
            document.getElementById("map_chart_salita")
        );
        var dataTable = google.visualization.arrayToDataTable(ar);
        dataTable.addColumn({ type: 'string', role: 'tooltip' });
        for (var i = 0; i < dataTable.getNumberOfRows(); i++) {
            if (dataTable.getValue(i, 0) != 0)
                {
                dataTable.setValue(i, 2,
                " Pend. % " +    (dataTable.getValue(i, 1) /
                    dataTable.getValue(i, 0) * 100).toFixed(2).toString())
            }
        }    
        // costruzione del grafico    
        var options = {
            hAxis: { title: "al km", gridlines: { count: ar.length - 1, }, },
            vAxis: { title: "altitudine in m.", viewWindow: { min: 0, }, },
            title: "Altimetria in m. : ",
            curveType: "function",
            legend: { position: "bottom" },
            width: 350,
            height: 300,
        };
        chart.draw(dataTable, options);
    }
}
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}
async function righeTratta() {
    result.results.forEach(function (i, ct) {
        if (i.elevation == null) {
            i.elevation = tratta[tratta.lenght - 1]
        }
        tratta.push([ar[ct][0], i.elevation]);
        if (Math.round(i.elevation) > _max) { _max = Math.round(i.elevation) }
        if (Math.round(i.elevation) < _min) { _min = Math.round(i.elevation) }
        t_lun += (ar[ct][0] - tratta[1][0])
        t_alt += (i.elevation - tratta[1][1])
        if (pendenza < t_alt / t_lun) {
            pendenza = t_alt / t_lun
        }
        if ((tratta.length > 2) && (i.elevation - tratta[tratta.length - 2][1] > 0)) { dislivello += i.elevation - tratta[tratta.length - 2][1] }

    });

    return
}
// legge i dati della testata dei milestone della salita
// se è stata selezionata la tratta ( selezionato == 1)
// calcola inizio e fine, contenenti le due date e il milestone di
// partenza ( da ) e quello di arrivo ( a )    
function inizioFine() {
    return new Promise(function (resolve, reject) {
        inizio = 0
        fine = 0
        da = ""
        a = ""
        // loop
        dc.data_grafico.forEach(function (item) {
            // selezionato, scrivi inizio e da 
            if (item.selezionato == 1) {
                if (inizio == 0) {
                    inizio = item.inizio // data e ora inizio
                    da = item.indirizzo_da // milestone inizio
                }
                fine = item.fine        // imposta sempre la fine
                a = item.indirizzo_a    // milestone fine
            }
        })
        // ritorna i dati con promise resolve
        resolve([inizio, fine, da, a])
        // se non è stato letto niente, reject
        if (inizio == 0) {
            reject("KO")
        }
    })
}
function ret_el(result) {
    return new Promise(function (resolve, reject) {
        pr._param = []
        // costruisce l'array leggendo i dati ripresi dall'API
        result.results.forEach(function (i, cx) {
            // se valido
            if (i.elevation != null) {
                pr._param.push([i.elevation, i.location.lat, i.location.lng])
            }
            else
            // prendo il precedente se non è il primro rec
            {
                if (cx > 0) {
                    pr._param.push([result.results[cx - 1], i.location.lat, i.location.lng])
                }
            }
        })
        resolve("OK")
    })
}




function get_menu_opzioni() {



}
pr = {}
pr._paginaLoad = "documentazione.html"
include()
function include() {
  ["get_import"]
    .forEach(function (el) {
      var script = document.createElement("script");
      script.src = "/static/js/" + el + ".js";
      script.type = "text/javascript";
      document.getElementsByTagName("head").item(0).appendChild(script);
    })
}
//
// lettura sorgente
function doc_Main(data) {
  return new Promise(function (resolve, reject) {
    // eimino i dati dal div 
    div = document.getElementById('Main_h')
    div.innerHTML = ""
    // creo un elemento con lo stesso nome della routine
    let node = document.createTextNode(data[2]);
    node.className = "doc_selected_page_testo_h1"
    div.appendChild(node);
    // scrivo il successivo node contenente il testo
    div = document.getElementById('Main')
    div.innerHTML = ""
    //
    pr._param = "static/js/" + data[3]
    pr._tipofile = "utf-8"
    pr._type = "fs"
    pr._sql = "readFilelineByline"
    pr._div = div
    load(pr)
      .then(function (result) {
        // spaziatura
        space = "<span style='color: white;'>----</span>"
        // rientro
        num_space = 0
        // lettura 
        result.forEach(function (line,ct) {
          // per determinare il nome della function
          nameFunction = line
          // creo un elemento di tipo p per l'intestazione
          node = document.createElement("p");
          node.className = "doc_selected_page_testo_h3"
          // creo un div
          nodex = document.createElement("div");
          nodex.className = "doc_selected_page_testo_h3"
          // colore delle linee, altrimenti quello dello style
          green = "<span style='color: green;'> //"
          blue = "<span style='color: blue;'> function "
          blue_async = "<span style='color: blue;'> async function "
          red = "<span style='color: red;'>"
          // la linea include un commento
          // span + linea
          if (line.includes("//")) {
            line = line.replace("//", green) + " </span>"
          }
          // la linea include un async function
          // non è un ForEach e la function è nominata
          if (line.includes("async function")) {
            if ((line.includes('forEach(function') == false) &&
              (line.includes('function (') == false)) {
              linex = line.replace("async function ", "")
              linex = linex.substr(0, linex.indexOf("("))
              line = line.replace("async function ", blue_async) + " </span>"
              nodex.id = linex
              div.appendChild(nodex)
            }
          }
          else if (line.includes("function")) {
            if ((line.includes('forEach(function') == false) &&
              (line.includes('function (') == false)) {
              linex = line.replace("function ", "")
              linex = linex.substr(0, linex.indexOf("("))
              line = line.replace("function", blue) + " </span>"
              nodex.id = linex
              div.appendChild(nodex)
            }
          }


          ct = 0
          inizio = -1
          Array.from(line).forEach(function (i) {
            if (i == '"' && inizio == -1 && ct > 0) {
              inizio = ct
            }
            if (i == '"' && inizio != -1 && ct != inizio) {
              fine = ct
              if (inizio != -1 && fine != -1)
                lenof = (red + "</span>").length
              {
                line = line.replace(line.substr(inizio, fine - inizio + 1), red + line.substr(inizio,
                  fine - inizio + 1) + "</span>")
              }
              ct += lenof
              inizio = -1
              fine = -1
            }
            ct += 1
          })
          ctnumspace = 0
          while (ctnumspace < num_space) {
            node.innerHTML += space
            ctnumspace += 1
          }

          node.innerHTML += line
          if (line.includes("{")) {
            num_space += 1
          }
          if (line.includes("}")) {
            num_space -= 1
          }
          div.appendChild(node)
        })
        var element = div;
        var children = element.children;
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.innerHTML.includes("//"))
            {
          // max 4 linee di commento
          ct = 1
          while (ct < 5)
          {
            if ((i + ct) < children.length)
              {
            if (children[i+ct].id != "")
            {
              child.id = children[i + ct].id
              ct=1000
              }
            }
            ct+=1  
          }
          }
        }
        resolve(div)
      })
  })
}

// visualizzazione organigramma procedura

function documentazioneOrg() {
  google.charts.load('current', { packages: ["orgchart"] });
  google.charts.setOnLoadCallback(drawChart);
  // disegna l'organigramma
  function drawChart() {
  
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Procedura');
    data.addColumn('string', 'Precedente');
 

  
    data_b = function_crea_data()
      data_b.forEach(function (datab) { 
      data.addRow(  [
        {
          'v': datab[0],
          'f': '<a href="#' + datab[0].replace("()", "") + '">' + datab[0].replace("()", "") + '</a>'
        },
        datab[1],
      ] )
    })
    // Create the chart.
    var chart = new google.visualization.OrgChart(document.getElementById('chart_div'));
    // Draw the chart, setting the allowHtml option to true for the tooltips.
    // opzioni di visualizzazione
    var options = {
      showRowNumber: false,
      allowCollapse: true,
      nodeClass: 'orgNodeClass',
      selectedNodeClass: 'orgSelectedNodeClass',
      size: 'small',
      pageSize: 20,
      allowHtml: true,
      page: "enable",
      width: "100%",
      height: "100%",
      tooltip: { isHtml: true },
    };
   

    // Create the chart.
    var chart = new google.visualization.OrgChart(document.getElementById('chart_div'));
    // Draw the chart, setting the allowHtml option to true for the tooltips.
    chart.draw(data, options);
    function setTooltipContent(row) {
      if (row != null) {
        var content = data_b[row][0]
        
          s = "<div id='org'"
          s += "<p>Routine:</p>"
          s += "<p id 'org_routine'>"
          s += content
          s += "</p>"
          s += "</div>"
div=document.createElement("div")
        div.innerHTML = s
              
    //    document.getElementById('chart_div').appendChild(div)        
      }
    } 
    /*
    google.visualization.events.addListener(chart, 'onmouseover', function (e) {
      setTooltipContent(e.row);
    });
*/
    google.visualization.events.addListener(chart, 'select', function () {
      var selection = chart.getSelection();
      if (selection.length > 0 && data_b[selection[0].row][3] != '') {
        doc_Main(data_b[selection[0].row]).then(function (result) {
      //    document.getElementById(data_b[selection[0].row][0].replace("()", "")).focus();
        })
      }
    });
  }
} 
function xxfunction_crea_data()
{
  let data_b = []
  data_b.push(['Main()', '', 'Routine iniziale', 'Main.js'])
  data_b.push(['include()', 'Main()', 'Inclusione script', 'Main.js'])
  data_b.push(['Main_Routines', 'Main()', 'Routines', ''])
  data_b.push(['get_dc()', 'Main_Routines', 'Dati comuni', ''])
  data_b.push(['get_parametri()', 'Main_Routines', 'Parametri', ''])
  data_b.push(['hidden_div()', 'Main_Routines', 'Formattazione', 'Main.js'])
  data_b.push(['get_menu()', 'Main_Routines', 'Menu', 'get_menu.js'])
  data_b.push(['get_import()', 'get_menu()', 'Importazione', 'get_import.js'])
  data_b.push(['get_table_uscita()', 'get_menu()', 'Uscite', 'get_table_uscita.js'])
  data_b.push(['fitget_milestones()', 'get_menu()', 'Salite', 'get_milestones.js'])
  data_b.push(['get_login()', 'get_menu()', 'Impostazione utente', 'get_login_logout.js'])
  data_b.push(['get_logout()', 'get_menu()', 'Scollegamento utente', 'get_login_logout.js'])
  data_b.push(['get_files_in_directory()', 'get_import()', 'Importazione', ''])
  data_b.push(['get_login()', 'get_menu()', 'Impostazione utente', 'get_login_logout.js'])
  data_b.push(['get_import_file_bin()', 'get_import()', 'Importazione files(server)', ''])
  data_b.push(['Chart_testata()', 'get_table_uscita()', 'Lista testate', 'get_chart.js'])
  data_b.push(['fitget_layers_uscita', 'Chart_testata()', 'Itinerario', 'fitget_layers_uscita.js'])
  data_b.push(['get_polyline', 'fitget_layers_uscita', 'Punti itinerario', ''])
  data_b.push(['fitget_milestones', 'fitget_layers_uscita', 'Punti Milestone', ''])
  data_b.push(['fnc_wait', 'fitget_milestones', 'Punti Milestone', ''])



  data_b.push(['get_table_map', 'Chart_testata()', 'tabella Map', 'fitget_layers_uscita.js'])
  data_b.push(['get_menu_opzioni()', 'Chart_testata()', 'Menu ', ''])
  data_b.push(['get_files_passati()', 'get_import()', 'Importazione', ''])

  return data_b
  
}

function function_crea_data() {
  let data_b = []
  // nome,precedente,descrizoone,file
  data_b.push(['FIT', '', 'Fit', 'fitServer.js'])
  data_b.push(['Server', 'FIT', 'Routine avvio server', 'fitServer.js'])
  data_b.push(['impostaPorta()', 'Server', 'Impostazione server', ''])
  data_b.push(['decodeRequest()', 'Server', 'decodifica url', ''])
  data_b.push(['contentType()', 'sendFileContent()', 'tipo file', ''])
  data_b.push(['sendFileContent()', 'Server', 'invio informazioni al browser', ''])
  data_b.push(['_fs.fnc_readFile', 'sendFileContent()', 'lettura oggetto', ''])
  
  data_b.push(['_usr.user', 'sendFileContent()', 'gestione utente', ''])
  
  data_b.push(['_sql.hashPassword', '_usr.user', 'gestione utente', ''])

  data_b.push(['positionFile()', 'Server', 'estensione oggetto', ''])
  data_b.push(['elaborazioni()', 'Server', 'Elaborazioni richieste', ''])

  data_b.push(['Main()', 'FIT', 'Routine avvio Web', 'fitMain.js']) 
  data_b.push(['include()', 'Main()', 'Inclusione script', 'fitMain.js'])
  data_b.push(['Main_Routines', 'Main()', 'Routines', ''])
  data_b.push(['get_dc()', 'Main_Routines', 'Dati comuni', ''])
  data_b.push(['get_parametri()', 'Main_Routines', 'Parametri', ''])
  data_b.push(['hidden_div()', 'Main_Routines', 'Formattazione', 'hidden_div.js'])
  data_b.push(['get_menu()', 'Main_Routines', 'Menu', 'get_menu.js'])
  data_b.push(['get_import()', 'get_menu()', 'Importazione', 'get_import.js'])
  data_b.push(['fitget_uscita()', 'get_menu()', 'Visualizzazione', 'fitget_uscita.js'])
  
  data_b.push(['fnc_checkfiltered()', 'fitget_uscita()', 'Visualizzazione', 'fitget_uscita.js'])
  
  data_b.push(['Chart_testata()', 'fitget_uscita()', 'Visualizzazione uscite', 'fitget_chart.js'])
  
  data_b.push(['selectChartTestata', 'fitget_uscita()', 'seleziona', 'fitget_chart.js'])
  
  data_b.push(['get_layers_uscita', 'selectChartTestata', 'Visualizza map', 'fitget_chart.js'])
  
  data_b.push(['selectChartTestata', 'ricalcoloMilestones', 'Ricalcolo milestones', 'fitget_chart.js'])
  
  data_b.push(['Chart_uscita', 'selectChartTestata', 'Altimetria', 'fitget_chart.js'])

  data_b.push(['fitget_milestones()', 'get_menu()', 'Salite', 'get_milestones.js'])
  data_b.push(['fnc_wait()', 'fitget_milestones()', 'Attesa', ''])
  data_b.push(['hidden_div()', 'fitget_milestones()', 'Preparazione', ''])
  data_b.push(['get_bounders()', 'fitget_milestones()', 'limiti mappa', ''])

  data_b.push(['tileMap()', 'Main()', 'Gestione map', ''])
  data_b.push(['load()', 'Main()', 'Inquiry server', ''])


  return data_b

}
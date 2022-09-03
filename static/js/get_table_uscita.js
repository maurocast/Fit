// Visualizzazione tabella di testata
async function get_table_uscita() {
  // impostazioni google
  google.load("visualization", "1", { packages: ["table"] });
  // reperimento dati da db - get_fit_tes
  async function get_fit_tes()
  {
    return new Promise(function (resolve, reject) {
      pr._type = "SQL_ALL";
      pr._sql = "select * from fit_tes order by data desc";
      pr._param = [];
      load(pr).then(function (result) {
          resolve(result)
      })  
    })
  };
  data_grafico_testata = await get_fit_tes()
  // Visualizzazione
  
  google.charts.setOnLoadCallback(function () {
    Chart_testata(data_grafico_testata);
  });
}
// aggiunta milestone ricerca
async function get_filterMilestone() {
  return new Promise(function (resolve, reject) {
    pr._type = "SQL_ALL";
    pr._sql = "select * from fit_milestone order by city,indirizzo";
    pr._param = [];
    load(pr)
      .then(function (result) {
        s =
          "  <select name='selectMilestone' id='selectMilestone' onchange='get_table_uscita(value,1)'> ";
        s += "<option value='Seleziona:'>Seleziona</option>"
        result.forEach(function (element) {
          s +=
            "<option value='" +
            element.indirizzo + " " + element.city +
            "'>" +
            element.indirizzo + " " + element.city +
            "</option>";
        });
        s += "</select > ";
        resolve(s)
      })
  })
}
// aggiunta milestone ricerca
async function get_filterData() {
  return new Promise(function (resolve, reject) {
    resolve("<input type='date' id='dataUscita' name='dataUscita'  " +
      "onchange='get_table_uscita(dataUscita.value,0)'></input>")
  })
}
function fnc_checkfiltered(value, tipo)
{
  if (tipo != undefined && value != 'Seleziona:') {
    if (tipo == 0) {
      filtered = dc.data_grafico_testata.filter(function (rec) {
        return rec.data == value
      })
    }
    else {
      filtered = dc.data_grafico_testata.filter(function (rec) {
        return rec.tragitto.includes(value)
      })
    }
    return filtered
  }
}
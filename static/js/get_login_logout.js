// Autenticazione
// la funzione controlla l'esistenza dell'Utent, la password e l'HASH
function get_login() {
  hidden_div(["div_container"], ["div_login"], [])
  // Button invio
  document.getElementById("LogButton").
    addEventListener("click", async function (e) {
      clicklogButton(e)
    })
  // Gestione click su Utente
  function clicklogButton(event) {
    if (dc.name.value != "") {
      hidden_div(["P_name"], [], [])
    }
    if (dc.password.value != "") {
      hidden_div(["P_password"], [], [])
    }
    // per chiamare la funzione sul server
    pr._type = "user";
    pr._param = [dc.name.value, dc.password.value];
    load(pr)
      .then(function (result) {
        // autenticato
        if (result != "") {
          dc.name.style.color = "black";
          hidden_div(/*none,block,flex */
            ["div_logerror", "div_login", "idlogin"], ["div_logged"], [])
          // nome dell' utente
          document.getElementById('idlogout').innerHTML = result.Nome + " " + result.Cognome + "</BR>Esci";
        }
        else {
          // non autenticato
          get_login_error()
        }
      },
        // errore nell'esecuzione
        function (error) {
          get_login_error();
        })
  }
  // mancata autenticazione  
  function get_login_error() {
    dc.password.style.color = "red";
    dc.name.style.color = "red";
    hidden_div(/*none,block,flex */
      ["div_logged"],
      ["div_logerror", "div_login"],
      []
    )
  }
}
// logout
// ritorna alla richiesta utente
function get_logout() {
  // visualizza il div di richiesta
  hidden_div(["div_logerror", "div_logged", "div_login"], ["idlogin"], []);
  // elimina password
  dc.password.value = ""
  // ripristina lo stile
  dc.password.style.color = "black";
}
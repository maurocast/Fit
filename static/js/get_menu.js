// gestione relativa al div_menu
// abbinamento al tasto on click faunction
function get_menu() {
  // Importazione file da binario a database
  // lancio in modalità server
  importazione();
  // Visualizzazione tabella uscite
  // dalla tabella della testata uscita è possibile scegliere
  // la visualizzazione del percorso
  visualizzazione();
  // Milestones
  // visualizzazione statistiche e percorsi per singola salita
  salite();
  // login
  login();
  // logout
  logout();
}

function importazione() {
  dc.Importazione
    .addEventListener("click", function () {
      hidden_div([], [], []);
      get_import();
    });
}

function visualizzazione() {
  dc.Visualizzazione
    .addEventListener("click", async function () {
      hidden_div(["div_login"], [], []);
      get_table_uscita();
    });
}

function salite() {
  dc.Milestones
    .addEventListener("click", async function () {
      hidden_div([], ["div_container"], []);
      get_milestones();
    });
}

function login() {
  dc.idlogin
    .addEventListener("click", async function () {
      // esegue la fase di collegamento dell'Utente
      get_login();
    });
}

function logout() {
  dc.idlogout
    .addEventListener("click", async function () {
      // esegue la fase di scollegamento dell'Utente
      get_logout();
    });
}
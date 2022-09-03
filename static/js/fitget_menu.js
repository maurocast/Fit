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
            fitget_uscite();
        });
}
// Visualizzo la map contenente i milestone di arrivo
// delle salite
async function salite() {
    dc.Milestones
        .addEventListener("click", async function () {
            hidden_div([], ["div_container"], []);
            await fitget_milestones();
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
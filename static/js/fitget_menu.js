// gestione relativa al div_menu
// abbinamento al tasto on click faunction
function get_menu() {
    // Importazione file da binario a database
    // lancio in modalità server
    async function importazione() {
        dc.Importazione
            .addEventListener("click", async function () {
                hidden_div([], [], []);
                await get_import();
            });
    }
    importazione();
    // Visualizzazione tabella uscite
    // dalla tabella della testata uscita è possibile scegliere
    // la visualizzazione del percorso
    function visualizzazione() {
        dc.Visualizzazione
            .addEventListener("click", async function () {
                hidden_div(["div_login"], [], []);
                fitget_uscite();
            });
    }
    visualizzazione();
    // Milestones
    // visualizzazione statistiche e percorsi per singola salita
    async function salite() {
        dc.Milestones
            .addEventListener("click", async function () {
                hidden_div([], ["div_container"], []);
                await fitget_milestones();
            });
    }
    salite();
    // login
    function login() {
        dc.idlogin
            .addEventListener("click", async function () {
                // esegue la fase di collegamento dell'Utente
                get_login();
            });
    }
    login();
    // logout
    function logout() {
        dc.idlogout
            .addEventListener("click", async function () {
                // esegue la fase di scollegamento dell'Utente
                get_logout();
            });
    }
    logout();
}
